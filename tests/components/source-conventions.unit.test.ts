import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "vitest";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { Platform } from "../../src/components/sdk.ts";
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
  test("root platform memory files stay linked to README", () => {
    for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
      const filePath = join(repoRoot, fileName);
      assert.equal(lstatSync(filePath).isSymbolicLink(), true, `${fileName} should be a symlink`);
      assert.equal(readlinkSync(filePath), "README.md", `${fileName} should point at README.md`);
      assert.equal(
        readFileSync(filePath, "utf-8"),
        readFileSync(join(repoRoot, "README.md"), "utf-8"),
        `${fileName} content should match README.md`,
      );
    }
  });

  test("README documents current component counts and procedure runtime", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf-8");
    const componentSurface = validateRegistry(registry);
    const currentCounts =
      `${registry.skills.length} 个 skill、${registry.agents.length} 个 agent、` +
      `${registry.hooks.length} 个 hook、${registry.procedures.length} 个 procedure`;
    const claudeHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Claude)).length;
    const codexHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Codex)).length;
    const claudeProcedureCount = collectPlatformProcedures(componentSurface, Platform.Claude).length;
    const codexProcedureCount = collectPlatformProcedures(componentSurface, Platform.Codex).length;
    const gateSummary =
      `- \`dist/claude\` 生成 ${registry.skills.length} 个 skill、${registry.agents.length} 个 agent、${claudeHookCount} 个 hook 和 ${claudeProcedureCount} 个 procedure；` +
      `\`dist/codex\` 生成 ${registry.skills.length} 个 skill、${registry.agents.length} 个 agent、${codexHookCount} 个 hook 和 ${codexProcedureCount} 个 procedure`;

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
    assert.equal(
      readme.includes("两端都生成 `procedures.js` bundle"),
      true,
      "README quality-gate summary should include procedure runtime count",
    );
    assert.doesNotMatch(readme, /^\s+rules\/$/m);
    assert.match(readme, /procedureUse\(procedureDefinition\)/);
    assert.match(readme, /构建器会生成 `## 检查清单`，并放在生成的 `## 反模式` 之后/);
    assert.match(readme, /Agent 不再使用 `AGENT\.body\.md`/);
    assert.match(readme, /`InvocationPolicy\.ModelOnly` 只用于 Claude-only skill/);
    assert.match(readme, /`procedureUse\(procedureDefinition, \{ platforms: \[\.\.\.\] \}\)`/);
    assert.match(readme, /defineAgentWorkflow\(\{/);
    assert.match(
      readme,
      /defineAntiPattern,\n  defineReference,\n  defineSkill,\n  InvocationPolicy,\n  KnownTool,\n  Platform,\n\} from "\.\.\/\.\.\/sdk"/,
    );
    assert.match(readme, /defineAgent,\n  defineAgentWorkflow,\n  defineAgentWorkflowStep,\n  KnownTool,\n  Platform,\n  SkillUseMode,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /type NormalizedHookPayload,\n  type NormalizedHookResult,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /from "\.\.\/\.\.\/skills\/typescript-type-safety\/index"/);
    assert.doesNotMatch(readme, /from "\.\.\/skills\//);
    assert.doesNotMatch(readme, /body: new URL\("\.\/AGENT\.body\.md"|agent body/);
    assert.doesNotMatch(readme, /338 个 skill|scripts\/manifest\.json|defineSkillScript\(\)|skill script registry/);
    assert.doesNotMatch(readme, /优先插入到 `## 反模式`/);
  });

  test("component check script runs every typecheck gate", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
    const scripts = packageJson.scripts as Record<string, string>;
    const checkComponents = scripts["check:components"] ?? "";
    const typecheckScripts = Object.keys(scripts)
      .filter((scriptName) => scriptName.startsWith("typecheck:"))
      .sort();
    const missingTypecheckScripts = typecheckScripts.filter(
      (scriptName) => !checkComponents.includes(`npm run ${scriptName}`),
    );

    assert.deepEqual(
      missingTypecheckScripts,
      [],
      "`check:components` should run every dedicated typecheck script",
    );
    assert.match(checkComponents, /tsx src\/build\.ts --check/);
  });

  test("component API exposes procedures through the single component layout", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const proceduresIndexSource = readFileSync(join(repoRoot, "src/components/procedures/index.ts"), "utf-8");
    const registrySource = readFileSync(join(repoRoot, "src/components/registry.ts"), "utf-8");
    const buildRoot = join(repoRoot, "src/build");
    const coreSource = readFileSync(join(buildRoot, "core.ts"), "utf-8");

    assert.doesNotMatch(
      sdkSource,
      /\b(?:ScriptDefinition|ScriptUseDefinition|SkillScriptRootDefinition|defineScript|defineScriptUse|defineSkillScriptRoot|scriptRoots\?:|scripts\?:)\b/,
    );
    assert.doesNotMatch(proceduresIndexSource, /\b(?:scriptUse|componentScripts)\b/);
    assert.doesNotMatch(registrySource, /\bscripts:/);
    assert.equal(existsSync(join(buildRoot, "scripts.ts")), false);
    assert.equal(existsSync(join(buildRoot, "script-uses.ts")), false);
    assert.doesNotMatch(readFileSync(join(buildRoot, "procedures.ts"), "utf-8"), /__aiExpertsScriptDir/);
    assert.match(coreSource, /export const sourceRoot = join\(repoRoot, "src\/components"\);/);
    assert.equal(
      existsSync(join(repoRoot, "plugins")),
      false,
      "component sources should only live under the canonical src/components root",
    );
  });

  test("component source directories match the registered component surface", () => {
    const skillDirs = readdirSync(join(repoRoot, "src/components/skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const agentDirs = readdirSync(join(repoRoot, "src/components/agents"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    assert.deepEqual(
      skillDirs,
      registry.skills.map((skill) => skill.id).sort(),
      "every skill source directory should be registered and every registered skill should have a source directory",
    );
    assert.deepEqual(
      agentDirs,
      registry.agents.map((agent) => agent.id).sort(),
      "every agent source directory should be registered and every registered agent should have a source directory",
    );
  });

  test("skill source uses platform-neutral workspace output paths", () => {
    const platformSpecificDocPaths: string[] = [];
    for (const sourceFile of collectFiles(join(repoRoot, "src/components/skills"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/(?:^|[`"'\s])\.(?:claude|codex)\/docs\//.test(source)) {
        platformSpecificDocPaths.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificDocPaths,
      [],
      "cross-platform skills should write workspace docs under neutral paths such as docs/ai/, not .claude/docs/ or .codex/docs/",
    );
  });

  test("runtime component sources do not leak maintainer-local absolute paths", () => {
    const localPathPattern = /(?:^|[\s"'`(])(?:\/Users\/[^\s"'`)]+|\/home\/[^\s"'`)]+|\/private\/var\/[^\s"'`)]+|\/var\/folders\/[^\s"'`)]+|[A-Za-z]:\\Users\\[^\s"'`)]+)/u;
    const leakedPaths: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (localPathPattern.test(source)) {
        leakedPaths.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(leakedPaths, [], "runtime component files should use portable paths, placeholders, or variables");
  });

  test("skill activation analyzer uses component terminology", () => {
    const activationAnalyzerSources = [
      join(repoRoot, "src/components/procedures/sources/skill-activation-analyzer/cso_audit.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-activation-analyzer/references")),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-activation-analyzer/evals")),
    ];

    for (const sourceFile of activationAnalyzerSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /插件|plugin|Claude 会|Claude 难|Claude 一次/u,
        `${sourceFile} should use platform-neutral component terminology`,
      );
    }
  });

  test("screenshot procedures use platform-neutral helper labels", () => {
    const screenshotSources = collectFiles(join(repoRoot, "src/components/procedures/sources/screenshot"));

    for (const sourceFile of screenshotSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /CODEX_SCREENSHOT|codex-shot|Codex if needed|Codex skills|Cross-platform screenshot helper for Codex/u,
        `${sourceFile} should not expose Codex-specific screenshot labels in cross-platform helpers`,
      );
    }
  });

  test("skill creator viewer uses platform-neutral review wording", () => {
    const viewerSource = readFileSync(
      join(repoRoot, "src/components/skills/skill-creator/assets/eval-viewer/viewer.html"),
      "utf-8",
    );

    assert.doesNotMatch(viewerSource, /Claude Code|告诉 Claude|回到 Claude/u);
    assert.match(viewerSource, /回到当前 CLI 会话告诉代理/u);
  });

  test("skill evaluator uses model-neutral knowledge wording", () => {
    const evaluatorSources = [
      join(repoRoot, "src/components/skills/skill-evaluator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references")),
    ];

    for (const sourceFile of evaluatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude 已知|Claude 不具备|Claude 不知道|Claude 不会|向 Claude|为 Claude|Claude 肯定|Claude 确实/u,
        `${sourceFile} should use model-neutral skill evaluation wording`,
      );
    }
  });

  test("copied skill readmes do not self-identify as Claude-only skills", () => {
    const skillReadmes = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("README.md"),
    );

    for (const readmeFile of skillReadmes) {
      const source = readFileSync(readmeFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\bA Claude skill\b|\bClaude skill\b|目录内脚本的本地用法/u,
        `${readmeFile} should describe the component neutrally because README files are copied to both platforms`,
      );
    }
  });

  test("AI collaboration examples include Codex when listing Claude Code and Cursor", () => {
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude Code\s*\/\s*Cursor(?![^()\n]*Codex)/u,
        `${sourceFile} should include Codex in cross-platform AI collaboration examples`,
      );
    }
  });

  test("skill markdown sources do not use placeholder markdown links", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\(\{[^}\n]+\}\)/u,
        `${sourceFile} should render placeholder URLs as plain text instead of broken local markdown links`,
      );
    }
  });

  test("cross-platform source names project memory files neutrally", () => {
    const platformSpecificMemoryRefs: string[] = [];
    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/全局 CLAUDE\.md|仓库 `CLAUDE\.md`|记忆文件 \/ plan \/ CLAUDE\.md/.test(source)) {
        platformSpecificMemoryRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificMemoryRefs,
      [],
      "cross-platform components should refer to project memory files neutrally, not only CLAUDE.md",
    );
  });

  test("hooks use the normalized payload contract", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const hookBuilderSource = readFileSync(join(repoRoot, "src/build/hooks.ts"), "utf-8");
    const hookSources = collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts"));

    assert.doesNotMatch(sdkSource, /\bLegacyHook(?:Payload|ToolInput)\b|payloadMode\?:/);
    assert.doesNotMatch(hookBuilderSource, /\btoLegacyClaudePayload\b|payloadMode|claude-raw/);
    for (const hookSource of hookSources) {
      const source = readFileSync(hookSource, "utf-8");
      assert.doesNotMatch(
        source,
        /\bLegacyHookPayload\b|payloadMode:\s*"claude-raw"|payload\?\.(?:tool_input|tool_name|transcript_path|session_id|stop_hook_active)/,
        `${hookSource} should consume NormalizedHookPayload directly`,
      );
    }
  });

  test("guarded procedure sources export main for bundled invocation", () => {
    const guardedWithoutExport = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      const hasMainGuard =
        /process\.argv\[1\][\s\S]{0,120}(?:fileURLToPath\(import\.meta\.url\)|__filename)/.test(source) ||
        /const\s+isMain\s*=\s*process\.argv\[1\]/.test(source);
      const exportsMain = /\bexport\s+(?:async\s+)?function\s+main\b|\bexport\s+const\s+main\b/.test(source);
      return hasMainGuard && !exportsMain;
    });

    assert.deepEqual(
      guardedWithoutExport,
      [],
      "procedures guarded by an is-main check must export main() so procedures.js can invoke only the selected module",
    );
  });

  test("registered procedures are executable entries, not helper-only modules", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function hasRunnableEntry(source: string): boolean {
      const exportsMain = /\bexport\s+(?:async\s+)?function\s+main\b|\bexport\s+const\s+main\b/.test(source);
      const invokesMain =
        /(?:^|\n)\s*(?:process\.exitCode\s*=\s*)?(?:await\s+)?main\(/.test(source) ||
        /(?:^|\n)\s*main\(\)\.(?:then|catch)\(/.test(source);
      const topLevelOutputOrExit =
        /(?:^|\n)(?:console\.(?:log|error|warn)|process\.(?:stdout|stderr)\.write|process\.exitCode\s*=|process\.exit\()/.test(source);
      return exportsMain || invokesMain || topLevelOutputOrExit;
    }

    const helperOnlyProcedures = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        return {
          id: procedure.id,
          path,
          source: readFileSync(path, "utf-8"),
        };
      })
      .filter(({ source }) => !hasRunnableEntry(source))
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      helperOnlyProcedures,
      [],
      "registered Procedure entries must be callable procedures; import-only helper modules should stay unregistered",
    );

    const sourceSideTestProcedures = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        return {
          id: procedure.id,
          path,
          source,
        };
      })
      .filter(({ path, source }) =>
        /\.test\.ts$/.test(path) ||
        /(?:^|\n)\s*\/\/\s*Smoke tests for\b/.test(source) ||
        /\bfrom\s+["']node:test["']/.test(source)
      )
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      sourceSideTestProcedures,
      [],
      "source-side smoke tests and test modules should stay out of the runtime Procedure manifest",
    );
  });

  test("procedure sources do not call sibling mjs helper files", () => {
    const physicalMjsHelperCalls = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /join\([^\n]*(?:scriptDir|SCRIPT_DIR|__dirname)[^\n]*\.mjs/.test(source) ||
        /spawnSync\((?:process\.execPath|"node"),\s*\[[^\]]*\.mjs/.test(source) ||
        /process\.execPath,\s*\[[^\]]*\.mjs/.test(source);
    });

    assert.deepEqual(
      physicalMjsHelperCalls,
      [],
      "bundled procedure sources should import helper modules directly instead of spawning adjacent .mjs files",
    );
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
      assert.doesNotMatch(
        source,
        /单个 plugin|未覆盖的 plugin/,
        `${agentSourceFile} should describe ai-experts audit scope with current component terms`,
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
      "SKILL.body.md",
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
  });
});
