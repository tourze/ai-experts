import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "vitest";
import { registry } from "../../src/components/registry.ts";
import {
  collectFiles,
  countH2OutsideCodeFence,
  countH2OutsideCodeFenceMatching,
  extractPropertyArray,
  firstNonEmptyLine,
  hasTopLevelHeadingOutsideCodeFence,
  repoRoot,
} from "./test-helpers";

describe("component source conventions", () => {
  test("README documents current component counts and procedure runtime", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf-8");
    const currentCounts = `${registry.skills.length} 个 skill、${registry.agents.length} 个 agent、${registry.hooks.length} 个 hook`;
    const gateSummary =
      `- \`dist/claude\` 与 \`dist/codex\` 都生成 ${currentCounts}，并包含 ${registry.procedures.length} 个 procedure 的 \`procedures.js\` bundle。`;

    assert.equal(
      readme.includes(`当前组件规模：${currentCounts}。`),
      true,
      "README component summary should match the registered component surface",
    );
    assert.equal(
      readme.includes(gateSummary),
      true,
      "README quality-gate summary should match generated dist manifests",
    );
    assert.match(readme, /procedureUse\(procedureDefinition\)/);
    assert.doesNotMatch(readme, /338 个 skill|scripts\/manifest\.json|defineSkillScript\(\)|skill script registry/);
  });

  test("agent source keeps structured fields", () => {
    const agentSource = readFileSync(
      join(repoRoot, "src/components/agents/typescript-reviewer/index.ts"),
      "utf-8",
    );
    assert.match(agentSource, /typescriptTypeSafetySkill\.id/);
    assert.doesNotMatch(agentSource, /id: "typescript-type-safety"/);

    const generatedRegistrySource = readFileSync(
      join(repoRoot, "src/components/registry.generated.ts"),
      "utf-8",
    );
    assert.doesNotMatch(
      generatedRegistrySource,
      /from\s+"\.\/hooks\//,
      "registry.generated.ts should not manually import hooks; build discovers hooks from src/components/hooks",
    );

    const removedLayer = ["migr", "ated"].join("");
    assert.equal(existsSync(join(repoRoot, "src/components", removedLayer)), false);
    assert.equal(
      existsSync(join(repoRoot, "src/components/profiles")),
      false,
      "profile layer should not be reintroduced; registry emits all registered components directly",
    );

    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    assert.doesNotMatch(sdkSource, /defineProfile|ProfileDefinition|ComponentKind\.Profile/);

    const agentBodyFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("AGENT.body.md"),
    );
    assert.deepEqual(agentBodyFiles, [], "agent Markdown bodies should be split into structured index.ts fields");

    let agentQualityStandardsCount = 0;
    let agentOutputFormatCount = 0;
    let agentWorkflowCount = 0;

    for (const agentSourceFile of collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("index.ts"),
    )) {
      const source = readFileSync(agentSourceFile, "utf-8");
      const hasBashTool = /\bKnownTool\.Bash\b/.test(source);
      const hasBashBoundary = /\n\s*bashBoundary:\s*\[/.test(source);
      const hasQualityStandards = /\n\s*qualityStandards:\s*\[/.test(source);
      const hasOutputFormat = /\n\s*outputFormat:\s*defineAgentOutputFormat\(\{/.test(source);
      const hasWorkflow = /\n\s*workflow:\s*defineAgentWorkflow\(\{/.test(source);

      assert.doesNotMatch(
        source,
        /\n\s*bodyText:\s*`/,
        `${agentSourceFile} should split body content into structured fields instead of bodyText`,
      );

      assert.equal(
        hasBashBoundary,
        hasBashTool,
        `${agentSourceFile} should define bashBoundary exactly when it declares KnownTool.Bash`,
      );

      if (hasBashBoundary) {
        const bashBoundarySource = extractPropertyArray(source, "bashBoundary");
        assert.notEqual(bashBoundarySource, null, `${agentSourceFile} should define bashBoundary as an array`);
        assert.match(
          bashBoundarySource as string,
          /["`][\s\S]*\S[\s\S]*["`]/,
          `${agentSourceFile} should define bashBoundary as a non-empty string array`,
        );
      }

      if (hasQualityStandards) {
        agentQualityStandardsCount += 1;
        const qualityStandardsSource = extractPropertyArray(source, "qualityStandards");
        assert.notEqual(
          qualityStandardsSource,
          null,
          `${agentSourceFile} should define qualityStandards as an array`,
        );
        assert.match(
          qualityStandardsSource as string,
          /["`][\s\S]*\S[\s\S]*["`]/,
          `${agentSourceFile} should define qualityStandards as a non-empty string array`,
        );
      }

      if (hasOutputFormat) {
        agentOutputFormatCount += 1;
        assert.doesNotMatch(
          source,
          /\n\s*outputFormat:\s*\[/,
          `${agentSourceFile} should define a single outputFormat object, not multiple formats`,
        );
        if (/kind:\s*"markdown"/.test(source)) {
          const sectionsSource = extractPropertyArray(source, "sections");
          assert.notEqual(sectionsSource, null, `${agentSourceFile} should define markdown output sections`);
          assert.match(
            sectionsSource as string,
            /defineAgentOutputSection\(\{/,
            `${agentSourceFile} should define each output section through defineAgentOutputSection`,
          );
          assert.doesNotMatch(
            sectionsSource as string,
            /(^|\n)\s*\{\s*\n\s*title:/,
            `${agentSourceFile} should not define bare output section objects`,
          );
        }
      }

      if (hasWorkflow) {
        agentWorkflowCount += 1;
        assert.match(
          source,
          /defineAgentWorkflow(?:Step|Gate|Route)\(\{/,
          `${agentSourceFile} should define workflow nodes through defineAgentWorkflow* helpers`,
        );
        assert.doesNotMatch(
          source,
          /\n\s*workflow:\s*\[/,
          `${agentSourceFile} should define a single workflow object, not multiple workflows`,
        );
        if (/defineAgentWorkflow(?:Gate|Route)\(\{/.test(source)) {
          assert.doesNotMatch(
            source,
            /\n\s*skill:\s*"[^"]+"/,
            `${agentSourceFile} should reference workflow skills through imported skill definitions`,
          );
          assert.match(
            source,
            /\n\s*skill:\s*\w+Skill\.id/,
            `${agentSourceFile} should reference workflow skills through .id`,
          );
        }
      }
    }

    assert.ok(agentQualityStandardsCount >= 60);
    assert.equal(agentOutputFormatCount, 62);
    assert.ok(agentWorkflowCount >= 76);
  });

  test("hook source tree uses canonical directories and ids", () => {
    const allowedHookRoots = new Set([
      "_shared",
      "command-safety",
      "context-compaction",
      "edit-safety",
      "prompt-guidance",
      "session-bootstrap",
      "skill-routing",
      "index.ts",
    ]);

    for (const hookSourceFile of collectFiles(join(repoRoot, "src/components/hooks"))) {
      const relativeHookPath = hookSourceFile.slice(join(repoRoot, "src/components/hooks").length + 1);
      assert.equal(
        allowedHookRoots.has(relativeHookPath.split(/[\\/]/)[0]),
        true,
        `${hookSourceFile} should live directly under business hook directories`,
      );
      assert.equal(
        relativeHookPath.split(/[\\/]/).includes("module"),
        false,
        `${hookSourceFile} should not use the old nested module directory`,
      );
      assert.doesNotMatch(
        relativeHookPath,
        /(?:expert|plugin)/,
        `${hookSourceFile} should not keep expert/plugin naming in hook paths`,
      );

      if (hookSourceFile.endsWith(".ts")) {
        const source = readFileSync(hookSourceFile, "utf-8");
        const hookId = source.match(/\bid:\s*"([^"]+)"/)?.[1];
        if (hookId) {
          assert.doesNotMatch(
            hookId,
            /(?:expert|plugin)/,
            `${hookSourceFile} should not keep expert/plugin naming in hook ids`,
          );
        }
      }
    }
  });

  test("TypeScript source keeps extensionless relative imports", () => {
    for (const sourceFile of collectFiles(
      join(repoRoot, "src/components"),
      (file) => file.endsWith(".ts"),
    )) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /from\s+["']\.[^"']+\.js["']|import\s+["']\.[^"']+\.js["']|import\(\s*["']\.[^"']+\.js["']\s*\)/,
        `${sourceFile} should use extensionless relative imports`,
      );
    }
  });

  test("skill body markdown keeps generator-owned sections out", () => {
    for (const bodyFile of collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("SKILL.body.md"),
    )) {
      const source = readFileSync(bodyFile, "utf-8");
      assert.equal(
        hasTopLevelHeadingOutsideCodeFence(source),
        false,
        `${bodyFile} should not contain an H1 heading; set fullName in index.ts instead`,
      );
      assert.match(
        firstNonEmptyLine(source),
        /^##\s+\S/,
        `${bodyFile} should start with an H2 section, not an intro paragraph`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "适用场景"),
        0,
        `${bodyFile} should not contain a useCases section; set useCases in index.ts instead`,
      );
      assert.equal(
        countH2OutsideCodeFenceMatching(source, (title) => title.startsWith("核心约束")),
        0,
        `${bodyFile} should not contain a constraints section; set constraints in index.ts instead`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "检查清单"),
        0,
        `${bodyFile} should not contain a checklist section; set checklist in index.ts instead`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "反模式"),
        0,
        `${bodyFile} should not contain an anti-pattern section; set antiPatterns in index.ts instead`,
      );
      assert.doesNotMatch(
        source,
        /\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/,
        `${bodyFile} should not contain explicit cross-skill links; set relatedSkills in index.ts instead`,
      );
    }
  });

  test("skill source does not keep legacy root package artifacts", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const legacyRootArtifacts = new Set(["HOW_TO_USE.md", "sample_input.json", "expected_output.json"]);
    const rootArtifacts = collectFiles(skillRoot, (file) => {
      const parts = file.slice(skillRoot.length + 1).split(/[\\/]/);
      return parts.length === 2 && legacyRootArtifacts.has(parts[1]);
    });

    assert.deepEqual(
      rootArtifacts,
      [],
      "root-level skill package artifacts should be split into references, assets, or evals before dist copy",
    );
  });

  test("skill index metadata definitions stay normalized", () => {
    const skillIndexFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("index.ts") && !file.split(/[\\/]/).includes("scripts"),
    );
    const goalDefinitionFiles: string[] = [];

    for (const skillSourceFile of skillIndexFiles) {
      const source = readFileSync(skillSourceFile, "utf-8");
      assert.match(source, /\n\s*useCases:\s*\[/, `${skillSourceFile} should define useCases`);
      assert.match(source, /\n\s*constraints:\s*\[/, `${skillSourceFile} should define constraints`);
      assert.doesNotMatch(source, /\n\s*tools:\s*\[\],/, `${skillSourceFile} should omit empty tools arrays`);
      if (/\bKnownTool\b/.test(source)) {
        assert.match(source, /KnownTool\./, `${skillSourceFile} should import KnownTool only when a tool is declared`);
      }
      const hasSkillBody = /\n\s*body:\s*new URL\("\.\/SKILL\.body\.md", import\.meta\.url\)/.test(source);
      const hasSourceDir = /\n\s*sourceDir:\s*new URL\("\.\/", import\.meta\.url\)/.test(source);
      if (!hasSkillBody) {
        assert.equal(hasSourceDir, true, `${skillSourceFile} should define sourceDir when it omits SKILL.body.md`);
        assert.match(
          source,
          /\n\s*(?:goal|workflow|outputs):\s*defineSkill(?:Goal|Workflow|Outputs)\(\{/,
          `${skillSourceFile} should define structured skill content when it omits SKILL.body.md`,
        );
      }
      if (/\n\s*goal:\s*defineSkillGoal\(\{/.test(source)) {
        goalDefinitionFiles.push(skillSourceFile);
        assert.doesNotMatch(
          source,
          /goal:\s*defineSkillGoal\(\{\s*body:/,
          `${skillSourceFile} goal should not be a default route-style body; move route text to description/useCases`,
        );
        assert.match(
          source,
          /goal:\s*defineSkillGoal\(\{\s*title:\s*["'`][^"'`]+["'`]/,
          `${skillSourceFile} goal must use a specific custom title such as 完成条件`,
        );
        assert.doesNotMatch(
          source,
          /goal:\s*defineSkillGoal\(\{\s*title:\s*(?:"目标"|'目标'|`目标`)/,
          `${skillSourceFile} goal title must not be the generic 目标 heading`,
        );
      }
      assert.doesNotMatch(
        source,
        /id:\s*"evals"|new URL\("\.\/evals(?:\/|")|target:\s*"references\/evals"|title:\s*"Eval Cases"/,
        `${skillSourceFile} should not register evals as references`,
      );
      assert.doesNotMatch(
        source,
        /\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/,
        `${skillSourceFile} should not contain explicit cross-skill links; set relatedSkills instead`,
      );

      const relatedSkillsSource = extractPropertyArray(source, "relatedSkills");
      if (relatedSkillsSource) {
        assert.doesNotMatch(
          relatedSkillsSource,
          /\n\s*id:\s*["']/,
          `${skillSourceFile} should import related skills and read otherSkill.id instead of hard-coded ids`,
        );
        assert.match(
          relatedSkillsSource,
          /\n\s*get id\(\) \{\n\s*return \w+Skill\.id;\n\s*\}/,
          `${skillSourceFile} should resolve related skill ids through imported skill definitions`,
        );
      }

      const checklistSource = extractPropertyArray(source, "checklist");
      if (checklistSource) {
        assert.match(
          checklistSource,
          /\n\s*"[^"]+"/,
          `${skillSourceFile} should define checklist as a non-empty string array`,
        );
        assert.doesNotMatch(
          checklistSource,
          /\[ \]/,
          `${skillSourceFile} checklist items should not contain "[ ]"; the build adds checkbox markers automatically`,
        );
      }

      const antiPatternsSource = extractPropertyArray(source, "antiPatterns");
      if (antiPatternsSource) {
        assert.match(
          antiPatternsSource,
          /defineAntiPattern\(\{\s*fail:\s*(?:"[^"]+"|'[^']+'|`[\s\S]+?`),\s*pass:\s*(?:"[^"]+"|'[^']+'|`[\s\S]+?`)/s,
          `${skillSourceFile} should define antiPatterns with defineAntiPattern({ fail, pass })`,
        );
        assert.doesNotMatch(
          antiPatternsSource,
          /\b(?:title|failTitle|passTitle|reason|severity)\s*:/,
          `${skillSourceFile} antiPatterns should only use fail and pass fields`,
        );
      }
    }

    assert.ok(
      goalDefinitionFiles.length <= 10,
      `goal is a rare field for non-routing completion contracts; found ${goalDefinitionFiles.length}: ${goalDefinitionFiles.join(", ")}`,
    );
  });
});
