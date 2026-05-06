import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "vitest";
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
  test("agent source and body files keep structured fields", () => {
    const agentSource = readFileSync(
      join(repoRoot, "src/components/agents/typescript-reviewer/index.ts"),
      "utf-8",
    );
    assert.match(agentSource, /typescriptTypeSafety\.id/);
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

    for (const agentBodyFile of collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("AGENT.body.md"),
    )) {
      const source = readFileSync(agentBodyFile, "utf-8");
      assert.notEqual(
        source.trim(),
        "",
        `${agentBodyFile} should be deleted instead of kept as an empty body placeholder`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "Bash 使用边界"),
        0,
        `${agentBodyFile} should move Bash boundary instructions to index.ts bashBoundary`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "质量标准"),
        0,
        `${agentBodyFile} should move quality standards to index.ts qualityStandards`,
      );
      assert.equal(
        countH2OutsideCodeFence(source, "输出格式"),
        0,
        `${agentBodyFile} should move output format instructions to index.ts outputFormat`,
      );
      for (const workflowHeading of ["工作方式", "必经门禁", "场景路由", "编排顺序"]) {
        assert.equal(
          countH2OutsideCodeFence(source, workflowHeading),
          0,
          `${agentBodyFile} should move workflow instructions to index.ts workflow`,
        );
      }
    }

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

    assert.equal(agentQualityStandardsCount, 60);
    assert.equal(agentOutputFormatCount, 62);
    assert.equal(agentWorkflowCount, 76);
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

  test("skill index metadata definitions stay normalized", () => {
    for (const skillSourceFile of collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("index.ts") && !file.split(/[\\/]/).includes("scripts"),
    )) {
      const source = readFileSync(skillSourceFile, "utf-8");
      assert.match(source, /\n\s*useCases:\s*\[/, `${skillSourceFile} should define useCases`);
      assert.match(source, /\n\s*constraints:\s*\[/, `${skillSourceFile} should define constraints`);
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
  });
});
