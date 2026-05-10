import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, test } from "vitest";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform, SkillUseMode } from "../../src/components/sdk.ts";
import {
  collectFiles,
  extractPropertyArray,
  markdownDestination,
  repoRoot,
  stripMarkdownCode,
} from "./test-helpers";

function githubStyleHeadingSlug(text: string): string {
  return text
    .replace(/`[^`]*`/gu, "")
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/gu, "")
    .replace(/[\t\n\r ]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\p{Connector_Punctuation}-]/gu, "");
}

function decodeMarkdownAnchor(anchor: string): string {
  try {
    return decodeURIComponent(anchor);
  } catch {
    return anchor;
  }
}

function normalizeMarkdownReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/gu, " ").toLowerCase();
}

function isLikelyLocalDefinitionPath(href: string): boolean {
  if (href.includes("[") || href.includes("]")) return false;
  return href.startsWith("./")
    || href.startsWith("../")
    || href.includes("/")
    || /\.[A-Za-z0-9]+$/u.test(href);
}

function localMarkdownPath(destination: string): string | null {
  const path = destination.split("#", 1)[0] ?? "";
  if (!path || path.startsWith("//") || /^[a-z][a-z0-9+.-]*:/iu.test(path)) {
    return null;
  }
  return path.replace(/\\/gu, "/");
}

function collectMarkdownAnchors(source: string): Set<string> {
  const slugCounts = new Map<string, number>();
  const anchors = new Set<string>();

  for (const line of source.split(/\r?\n/u)) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
    if (heading) {
      const baseSlug = githubStyleHeadingSlug(heading[2]);
      if (baseSlug) {
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
      }
    }

    for (const match of line.matchAll(/<a\s+[^>]*(?:id|name)=["']([^"']+)["'][^>]*>/giu)) {
      anchors.add(match[1].toLowerCase());
    }
  }

  return anchors;
}


describe("component source runtime guidance conventions", () => {
  test("agents do not preload explicit-only skills", () => {
    const skillsById = new Map(registry.skills.map((skill) => [skill.id, skill]));
    const violations: string[] = [];
    for (const agent of registry.agents) {
      for (const skillUse of agent.skills ?? []) {
        const skill = skillsById.get(skillUse.id);
        if (skillUse.mode === SkillUseMode.Preload && skill?.invocation === InvocationPolicy.ExplicitOnly) {
          violations.push(`${agent.id} -> ${skillUse.id}`);
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      "explicit-only skills set disable-model-invocation and cannot be preloaded by Claude subagents",
    );
  });

  test("agent runtime guidance names web access neutrally", () => {
    const agentSourceFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("index.ts"),
    );

    for (const agentSourceFile of agentSourceFiles) {
      const source = readFileSync(agentSourceFile, "utf-8");
      const toolsSource = extractPropertyArray(source, "tools");
      const runtimeSource = toolsSource ? source.replace(toolsSource, "") : source;
      assert.doesNotMatch(
        runtimeSource,
        /\bWebSearch\b|\bWebFetch\b/,
        `${agentSourceFile} should not expose platform-specific web tool names in runtime guidance`,
      );
    }
  });

  test("skill runtime guidance names web access neutrally", () => {
    const skillRuntimeFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) =>
        (file.endsWith(".md") || file.endsWith("index.ts")) &&
        !file.split(/[\\/]/).includes("evals"),
    );

    for (const skillRuntimeFile of skillRuntimeFiles) {
      const source = readFileSync(skillRuntimeFile, "utf-8");
      const toolsSource = skillRuntimeFile.endsWith("index.ts")
        ? extractPropertyArray(source, "tools")
        : null;
      const runtimeSource = toolsSource ? source.replace(toolsSource, "") : source;
      assert.doesNotMatch(
        runtimeSource,
        /\bWebSearch\b|\bWebFetch\b/,
        `${skillRuntimeFile} should not expose platform-specific web tool names in runtime guidance`,
      );
    }
  });

  test("skill runtime guidance avoids Claude-specific temporary paths", () => {
    const skillRuntimeFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) =>
        (file.endsWith(".md") || file.endsWith("index.ts")) &&
        !file.split(/[\\/]/).includes("evals"),
    );

    for (const skillRuntimeFile of skillRuntimeFiles) {
      const source = readFileSync(skillRuntimeFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude\s*\/\s*CLI|\/private\/tmp\/claude-|claude-\*\/\*\/tasks\/\*\.output/u,
        `${skillRuntimeFile} should describe temporary CLI artifacts without Claude-specific paths`,
      );
    }
  });

  test("agent source keeps structured fields", () => {
    const agentSource = readFileSync(
      join(repoRoot, "src/components/agents/typescript-reviewer/index.ts"),
      "utf-8",
    );
    assert.match(agentSource, /typescriptTypeSafetySkill\.id/);
    assert.doesNotMatch(agentSource, /id: "typescript-type-safety"/);

    for (const registryFile of [
      "registry.generated.ts",
      "registry.generated.skills.ts",
      "registry.generated.agents.ts",
    ]) {
      const generatedRegistrySource = readFileSync(
        join(repoRoot, "src/components", registryFile),
        "utf-8",
      );
      assert.doesNotMatch(
        generatedRegistrySource,
        /from\s+"\.\/hooks\//,
        `${registryFile} should not import hooks; hooks are registered through src/components/hooks/index.ts`,
      );
    }

    const removedLayer = ["migr", "ated"].join("");
    assert.equal(existsSync(join(repoRoot, "src/components", removedLayer)), false);
    assert.equal(
      existsSync(join(repoRoot, "src/components/profiles")),
      false,
      "profile layer should not be reintroduced; registry emits all registered components directly",
    );

    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    assert.doesNotMatch(sdkSource, /defineProfile|ProfileDefinition|ComponentKind\.Profile/);
    assert.doesNotMatch(
      sdkSource,
      /export type AgentDefinition = \{[\s\S]*?\n\s*body\?: ComponentFile;/,
      "AgentDefinition should not expose AGENT.body.md as a second body authoring path",
    );

    const agentBodyFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("AGENT.body.md"),
    );
    assert.deepEqual(agentBodyFiles, [], "agent Markdown bodies should be split into structured index.ts fields");

    let agentQualityStandardsCount = 0;
    let agentOutputFormatCount = 0;
    let agentWorkflowCount = 0;

    const agentSourceFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("index.ts"),
    );
    for (const agentSourceFile of agentSourceFiles) {
      const source = readFileSync(agentSourceFile, "utf-8");
      const hasBashTool = /\bKnownTool\.Bash\b/.test(source);
      const hasBashBoundary = /\n\s*bashBoundary:\s*\[/.test(source);
      const hasQualityStandards = /\n\s*qualityStandards:\s*\[/.test(source);
      const hasOutputFormat = /\n\s*outputFormat:\s*defineAgentOutputFormat\(\{/.test(source);
      const hasWorkflow = /\n\s*workflow:\s*defineWorkflow\(\{/.test(source);

      assert.doesNotMatch(
        source,
        /\n\s*bodyText:\s*`/,
        `${agentSourceFile} should split body content into structured fields instead of bodyText`,
      );
      assert.doesNotMatch(
        source,
        /\n\s*tools:\s*\[\s*\]/,
        `${agentSourceFile} should omit tools or declare explicit tools instead of emitting an empty tools list`,
      );
      assert.doesNotMatch(
        source,
        /\n\s*skills:\s*\[\s*\]/,
        `${agentSourceFile} should omit skills instead of emitting an empty skills list`,
      );
      assert.doesNotMatch(
        source,
        /单个 plugin|未覆盖的 plugin/,
        `${agentSourceFile} should describe ai-experts audit scope with current component terms`,
      );
      assert.doesNotMatch(
        source,
        /\p{Script=Han}\s+时使用/u,
        `${agentSourceFile} should not put a space between Chinese text and 时使用 in user-facing descriptions`,
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

      assert.equal(hasWorkflow, true, `${agentSourceFile} should define workflow through defineWorkflow`);
      if (hasWorkflow) {
        agentWorkflowCount += 1;
        assert.match(
          source,
          /defineWorkflow(?:Step|Gate|Route)\(\{/,
          `${agentSourceFile} should define workflow nodes through defineWorkflow* helpers`,
        );
        assert.doesNotMatch(
          source,
          /\n\s*workflow:\s*\[/,
          `${agentSourceFile} should define a single workflow object, not multiple workflows`,
        );
        if (/defineWorkflow(?:Gate|Route)\(\{/.test(source)) {
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
    assert.equal(agentWorkflowCount, agentSourceFiles.length);
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
        assert.doesNotMatch(
          source,
          /\.ai-components/,
          `${hookSourceFile} should use ai-experts runtime state directories`,
        );
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
    const sourceFiles = [
      join(repoRoot, "src/build.ts"),
      ...collectFiles(join(repoRoot, "src/build"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts")),
    ];
    for (const sourceFile of sourceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /from\s+["']\.[^"']+\.(?:ts|js|mjs|cjs)["']|import\s+["']\.[^"']+\.(?:ts|js|mjs|cjs)["']|import\(\s*["']\.[^"']+\.(?:ts|js|mjs|cjs)["']\s*\)/,
        `${sourceFile} should use extensionless relative imports`,
      );
    }
  });

  test("skill source does not use markdown body files", () => {
    const bodyFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("SKILL.body.md"),
    );
    assert.deepEqual(bodyFiles, [], "skill Markdown bodies should be split into structured index.ts fields");
  });

  test("skill source does not keep root package artifacts", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const rootArtifacts = new Set([
      "AGENTS.md",
      "CLAUDE.md",
      "HOW_TO_USE.md",
      "reference.md",
      "references.md",
      "MODEL_TEMPLATE.json",
      "_meta.json",
      "metadata.json",
      "sample_input.json",
      "expected_output.json",
    ]);
    const reservedSkillRootEntries = new Set([
      "index.ts",
      "index.js",
      "scripts",
      "references",
      "assets",
      "evals",
      "tests",
      "README.md",
      "LICENSE.txt",
    ]);
    const legacySkillScriptFiles = collectFiles(skillRoot, (file) =>
      file.slice(skillRoot.length + 1).split(/[\\/]/).includes("scripts"),
    );
    const legacySkillRuntimeDirs = collectFiles(skillRoot, (file) => {
      const parts = file.slice(skillRoot.length + 1).split(/[\\/]/);
      const legacyRuntimeDirs = [
        "commands",
        "hooks",
        "schemas",
        "examples",
        "resources",
        "prompts",
        "eval-viewer",
        "quick-ref",
        "rules",
        "templates",
        "canvas-fonts",
      ];
      return legacyRuntimeDirs.includes(parts[1] ?? "");
    });
    const misplacedRootArtifacts = collectFiles(skillRoot, (file) => {
      const parts = file.slice(skillRoot.length + 1).split(/[\\/]/);
      return parts.length === 2 && rootArtifacts.has(parts[1]);
    });
    const unregisteredRootEntries: string[] = [];
    for (const skillEntry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const skillDir = join(skillRoot, skillEntry.name);
      for (const entry of readdirSync(skillDir, { withFileTypes: true })) {
        if (reservedSkillRootEntries.has(entry.name)) continue;
        unregisteredRootEntries.push(`${skillEntry.name}/${entry.name}${entry.isDirectory() ? "/" : ""}`);
      }
    }

    assert.deepEqual(
      legacySkillScriptFiles,
      [],
      "skill-local scripts/ directories should move to src/components/procedures/sources/ and be referenced through procedures",
    );
    assert.deepEqual(
      legacySkillRuntimeDirs,
      [],
      "skill-local runtime/resource directories should move to first-class components, procedures, references, or assets",
    );
    assert.deepEqual(
      misplacedRootArtifacts,
      [],
      "root-level skill package artifacts and platform memory files should be split into references, assets, or evals before dist copy",
    );
    assert.deepEqual(
      unregisteredRootEntries.sort(),
      [],
      "skill root entries should be registered as references, assets, evals, procedures, or explicit README/LICENSE supplements",
    );
  });

  test("supplemental skill READMEs do not advertise external skill installation", () => {
    const readmeFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => basename(file) === "README.md",
    );
    const offenders: string[] = [];

    for (const readmeFile of readmeFiles) {
      const source = readFileSync(readmeFile, "utf-8");
      if (
        /npx\s+skills\s+add|google-labs-code\/stitch-skills|--skill\s+\S+\s+--global|dist\/(?:claude|codex)\/skills|src\/components\/skills|agents\/openai\.yaml|`(?:rust-best-practices|typescript-magician)`/u.test(
          source,
        )
      ) {
        offenders.push(relative(repoRoot, readmeFile));
      }
    }

    assert.deepEqual(
      offenders,
      [],
      "supplemental skill README files are copied into dist and must not point users at external install commands or platform-specific generated files",
    );
  });

  test("skill index metadata definitions stay normalized", () => {
    const skillIndexFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("index.ts") && !file.split(/[\\/]/).includes("scripts"),
    );
    const goalDefinitionFiles: string[] = [];
    let complexSkillWorkflowCount = 0;

    for (const skillSourceFile of skillIndexFiles) {
      const source = readFileSync(skillSourceFile, "utf-8");
      const hasWorkflow = /\n\s*workflow:\s*defineWorkflow\(\{/.test(source);
      assert.match(source, /\n\s*useCases:\s*\[/, `${skillSourceFile} should define useCases`);
      assert.match(source, /\n\s*constraints:\s*\[/, `${skillSourceFile} should define constraints`);
      assert.doesNotMatch(source, /\n\s*tools:\s*\[\],/, `${skillSourceFile} should omit empty tools arrays`);
      if (/\bKnownTool\b/.test(source)) {
        assert.match(source, /KnownTool\./, `${skillSourceFile} should import KnownTool only when a tool is declared`);
      }
      const hasSourceDir = /\n\s*sourceDir:\s*new URL\("\.\/", import\.meta\.url\)/.test(source);
      assert.doesNotMatch(source, /\n\s*body:\s*new URL\("\.\/SKILL\.body\.md", import\.meta\.url\)/);
      assert.equal(hasSourceDir, true, `${skillSourceFile} should define sourceDir`);
      assert.equal(hasWorkflow, true, `${skillSourceFile} should define workflow through defineWorkflow`);
      assert.match(
        source,
        /\n\s*(?:(?:goal|outputs):\s*defineSkill(?:Goal|Outputs)|workflow:\s*defineWorkflow)\(\{/,
        `${skillSourceFile} should define structured skill content`,
      );
      if (hasWorkflow) {
        assert.match(
          source,
          /defineWorkflow(?:Step|Gate|Route)\(\{/,
          `${skillSourceFile} should define workflow nodes through shared defineWorkflow* helpers`,
        );
        assert.doesNotMatch(
          source,
          /\n\s*workflow:\s*\[/,
          `${skillSourceFile} should define a single workflow object, not multiple workflows`,
        );
        if (/defineWorkflow(?:Gate|Route)\(\{/.test(source)) {
          complexSkillWorkflowCount += 1;
          assert.doesNotMatch(
            source,
            /\n\s*skill:\s*"[^"]+"/,
            `${skillSourceFile} should reference workflow skills through imported skill definitions`,
          );
          assert.match(
            source,
            /\n\s*skill:\s*\w+Skill\.id/,
            `${skillSourceFile} should reference workflow skills through .id`,
          );
        }
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
        /\]\((?:\.\/)?evals\//,
        `${skillSourceFile} should not link runtime skill content to source-side evals`,
      );
      assert.doesNotMatch(
        source,
        /\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/,
        `${skillSourceFile} should not contain explicit cross-skill links; set relatedSkills instead`,
      );
      assert.doesNotMatch(
        source,
        /交叉引用：/,
        `${skillSourceFile} should move cross-skill routing text to relatedSkills`,
      );
      assert.doesNotMatch(
        source,
        /需要和(?:其它|其他)技能联动时/,
        `${skillSourceFile} should move cross-skill routing text to relatedSkills`,
      );
      assert.doesNotMatch(
        source,
        /`(?:rust-best-practices|typescript-magician)`/,
        `${skillSourceFile} should use registered skill ids through relatedSkills, not deprecated aliases`,
      );
      assert.doesNotMatch(
        source,
        /(?<![./\w-])\b[a-z0-9]+(?:-[a-z0-9]+)*-expert\/(?!index\b)[a-z0-9]+(?:-[a-z0-9]+)*\b/,
        `${skillSourceFile} should not use plugin namespace skill references`,
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
        assert.doesNotMatch(
          relatedSkillsSource,
          /相关 skill：|\\\\n/,
          `${skillSourceFile} related skill reasons should be specific sentences, not copied route blobs`,
        );
        assert.doesNotMatch(
          relatedSkillsSource,
          /\n\s*label:/,
          `${skillSourceFile} related skills should use the canonical skill id as link text, not label aliases`,
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
    assert.ok(
      complexSkillWorkflowCount >= 3,
      "several production skills should exercise gates/routes so complex skill workflows stay covered",
    );
  });
});
