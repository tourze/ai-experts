import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "vitest";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { Platform } from "../../src/components/sdk.ts";
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

function localMarkdownPath(destination: string): string | null {
  const path = destination.split("#", 1)[0] ?? "";
  if (!path || path.startsWith("//") || /^[a-z][a-z0-9+.-]*:/iu.test(path)) {
    return null;
  }
  return path.replace(/\\/gu, "/");
}

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
    const claudeSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Claude)).length;
    const codexSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length;
    const claudeProcedureCount = collectPlatformProcedures(componentSurface, Platform.Claude).length;
    const codexProcedureCount = collectPlatformProcedures(componentSurface, Platform.Codex).length;
    const gateSummary =
      `- \`dist/claude\` 生成 ${claudeSkillCount} 个 skill、${registry.agents.length} 个 agent、${claudeHookCount} 个 hook 和 ${claudeProcedureCount} 个 procedure；` +
      `\`dist/codex\` 生成 ${codexSkillCount} 个 skill、${registry.agents.length} 个 agent、${codexHookCount} 个 hook 和 ${codexProcedureCount} 个 procedure`;

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
    assert.match(readme, /不要把整个 `~\/\.codex` symlink 到 `dist\/codex`/);
    assert.match(readme, /不要把整个 `~\/\.agents\/skills` symlink 到 `dist\/codex\/skills`/);
    assert.match(readme, /`installation_id` 和 `~\/\.agents\/skills\/\.system\/`/);
    assert.match(readme, /Codex dist 不输出与 Codex `\.system` 内置 skill 同名的用户级 skill/);
    assert.match(readme, /例如 `skill-creator`/);
    assert.match(readme, /`manifest\.json` 当前使用 schema 5/);
    assert.match(readme, /`install` 字段是安装器的一等事实源/);
    assert.match(readme, /`skillEntries` 从 `skillSourceRoot` 映射到 `skillRoot`/);
    assert.match(readme, /`forbiddenRootEntries` 与 `forbiddenSkillEntries`/);
    assert.match(readme, /Codex 的 `configRoot` 是 `~\/\.codex`、`skillRoot` 是 `~\/\.agents\/skills`/);
    assert.match(readme, /Codex 的 `rootEntries` 不包含 `skills\/`/);
    assert.match(readme, /需要 Node\.js >= 20\.19\.0/);
    assert.doesNotMatch(readme, /^\s+rules\/$/m);
    assert.match(readme, /procedureUse\(procedureDefinition\)/);
    assert.match(readme, /构建器会生成 `## 检查清单`，并放在生成的 `## 反模式` 之后/);
    assert.match(readme, /Agent 不再使用 `AGENT\.body\.md`/);
    assert.match(readme, /sourceDir: new URL\("\.\/", import\.meta\.url\)/);
    assert.doesNotMatch(readme, /SKILL\.body\.md|body: new URL\("\.\/SKILL\.body\.md"/);
    assert.match(readme, /`InvocationPolicy\.ModelOnly` 只用于 Claude-only skill/);
    assert.match(readme, /`procedureUse\(procedureDefinition, \{ platforms: \[\.\.\.\] \}\)`/);
    assert.match(readme, /仅单平台可用的关系使用 `platforms` 收窄/);
    assert.match(readme, /每个 skill 必须声明 `workflow: defineWorkflow/);
    assert.match(readme, /Agent 必须声明 `workflow: defineWorkflow/);
    assert.match(readme, /defineWorkflow\(\{/);
    assert.match(
      readme,
      /defineAntiPattern,\n  defineReference,\n  defineSkill,\n  defineWorkflow,\n  defineWorkflowGate,\n  defineWorkflowRoute,\n  defineWorkflowStep,\n  InvocationPolicy,\n  KnownTool,\n  Platform,\n\} from "\.\.\/\.\.\/sdk"/,
    );
    assert.match(readme, /defineAgent,\n  defineWorkflow,\n  defineWorkflowStep,\n  KnownTool,\n  Platform,\n  SkillUseMode,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /type NormalizedHookPayload,\n  type NormalizedHookResult,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /from "\.\.\/\.\.\/skills\/typescript-type-safety\/index"/);
    assert.doesNotMatch(readme, /from "\.\.\/skills\//);
    assert.doesNotMatch(readme, /body: new URL\("\.\/AGENT\.body\.md"|agent body/);
    assert.doesNotMatch(readme, /338 个 skill|scripts\/manifest\.json|defineSkillScript\(\)|skill script registry/);
    assert.doesNotMatch(readme, /优先插入到 `## 反模式`/);
  });

  test("component check script runs every typecheck gate", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
    const sourceTsconfigNames = [
      "tsconfig.build.json",
      "tsconfig.components.json",
      "tsconfig.hooks.json",
      "tsconfig.procedures.json",
    ];
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
    assert.equal(existsSync(join(repoRoot, "tsconfig.src.strict.tmp.json")), false);
    for (const tsconfigName of sourceTsconfigNames) {
      const tsconfig = JSON.parse(readFileSync(join(repoRoot, tsconfigName), "utf-8"));
      assert.equal(
        Object.hasOwn(tsconfig.compilerOptions ?? {}, "allowImportingTsExtensions"),
        false,
        `${tsconfigName} should not opt source code back into .ts extension imports`,
      );
    }
  });

  test("component API exposes procedures through the single component layout", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const proceduresIndexSource = readFileSync(join(repoRoot, "src/components/procedures/index.ts"), "utf-8");
    const registrySource = readFileSync(join(repoRoot, "src/components/registry.ts"), "utf-8");
    const buildRoot = join(repoRoot, "src/build");
    const buildSources = collectFiles(buildRoot, (file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf-8"))
      .join("\n");

    assert.doesNotMatch(
      sdkSource,
      /\b(?:ScriptDefinition|ScriptUseDefinition|SkillScriptRootDefinition|defineScript|defineScriptUse|defineSkillScriptRoot|scriptRoots\?:|scripts\?:)\b/,
    );
    assert.doesNotMatch(proceduresIndexSource, /\b(?:scriptUse|componentScripts)\b/);
    assert.doesNotMatch(registrySource, /\bscripts:/);
    assert.equal(existsSync(join(buildRoot, "scripts.ts")), false);
    assert.equal(existsSync(join(buildRoot, "script-uses.ts")), false);
    assert.doesNotMatch(readFileSync(join(buildRoot, "procedures.ts"), "utf-8"), /__aiExpertsScriptDir/);
    const canonicalSourceRootDeclarations = buildSources.match(
      /\bexport const sourceRoot = join\(repoRoot, "src\/components"\);/g,
    );
    assert.equal(
      canonicalSourceRootDeclarations?.length,
      1,
      "build code should expose exactly one canonical component source root",
    );
    const alternateSourceRootNames = buildSources.match(/\b(?:sourceRoots|componentSourceRoots)\b/g) ?? [];
    assert.deepEqual(
      alternateSourceRootNames,
      [],
      "build code should not expose alternate component source roots",
    );
    assert.doesNotMatch(
      buildSources,
      /ai-components-/,
      "build temp/runtime labels should use ai-experts naming instead of legacy ai-components prefixes",
    );
    assert.doesNotMatch(
      buildSources,
      /legacy lifecycle directory/,
      "build errors should describe canonical hook layout without exposing migration-era lifecycle wording",
    );
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

  test("Codex-enabled skill sources do not carry Anthropic-only license terms", () => {
    const restrictedLicensePattern = /Anthropic[\s\S]+ADDITIONAL RESTRICTIONS[\s\S]+may not[\s\S]+Extract these materials from the Services/u;

    for (const skill of registry.skills) {
      if (!skill.platforms.includes(Platform.Codex)) continue;
      const licensePath = join(repoRoot, "src/components/skills", skill.id, "LICENSE.txt");
      if (!existsSync(licensePath)) continue;
      assert.doesNotMatch(
        readFileSync(licensePath, "utf-8"),
        restrictedLicensePattern,
        `${skill.id} is Codex-enabled but carries Anthropic-only license terms`,
      );
    }
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

  test("repository skill utilities use the canonical component skills root", () => {
    const curateSkillsSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts"),
      "utf-8",
    );
    const canonicalSkillRootUsages =
      curateSkillsSource.match(/\bpath\.join\(repoRoot, "src\/components\/skills"\)/g) ?? [];

    assert.equal(
      canonicalSkillRootUsages.length,
      1,
      "repository skill curation should read from the single canonical component skills root",
    );
    assert.doesNotMatch(
      curateSkillsSource,
      /\b(?:sourceRoots|componentSourceRoots)\b/,
      "repository skill curation should not declare alternate source roots",
    );
  });

  test("procedure YAML handling uses the shared yaml package", () => {
    const yamlProcedureSources = [
      join(repoRoot, "src/components/procedures/sources/skill-creator/quick_validate.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_eval.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/utils.ts"),
      join(repoRoot, "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-activation-analyzer/cso_audit.ts"),
    ];
    const procedureBuilder = readFileSync(join(repoRoot, "src/build/procedures.ts"), "utf-8");

    for (const sourceFile of yamlProcedureSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.match(source, /from "yaml"/, `${sourceFile} should use the yaml package`);
      assert.doesNotMatch(
        source,
        /parseYamlScalar|不支持的 YAML 行|stripQuotes\(|nameMatch|descMatch|line\.startsWith\("name:"\)|line\.startsWith\("description:"\)/,
        `${sourceFile} should not maintain an ad hoc YAML/frontmatter parser`,
      );
    }
    assert.match(
      procedureBuilder,
      /id === "yaml" \|\| id\.startsWith\("yaml\/"\)/,
      "procedure runtime should bundle yaml instead of requiring user-level node_modules",
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

  test("cross-platform hook source comments use platform-neutral rationale", () => {
    const platformSpecificRationale: string[] = [];
    const legacyHookRuntimeTerms: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (!/platforms:\s*\[Platform\.Claude,\s*Platform\.Codex\]/.test(source)) continue;
      if (/\bClaude Code\b|\bAnthropic\b/u.test(source)) {
        platformSpecificRationale.push(relative(repoRoot, sourceFile));
      }
      if (/(?:向|让|强制|要求)\s*Claude|帮助 Claude|Claude (?:在|判断|根本|收到|拿到|完成)|Claude 自觉|原 skills\/|原 skill 文件已删除|── 执行步骤 ──/u.test(source)) {
        legacyHookRuntimeTerms.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificRationale,
      [],
      "cross-platform hooks should justify behavior in platform-neutral terms",
    );
    assert.deepEqual(
      legacyHookRuntimeTerms,
      [],
      "cross-platform hooks should not expose Claude-only or migrated skill workflow wording in runtime guidance",
    );
  });

  test("component guidance only names registered skills as standalone skills", () => {
    const registeredSkillIds = new Set(registry.skills.map((skill) => skill.id));
    const unknownSkillMentions: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(/`([a-z0-9][a-z0-9-]+)`\s+skill\b/gu)) {
        const skillId = match[1] ?? "";
        if (!registeredSkillIds.has(skillId)) {
          unknownSkillMentions.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unknownSkillMentions,
      [],
      "standalone skill mentions should point to registered skill ids; references should be named as references or flows",
    );
  });

  test("skill creator viewer uses platform-neutral review wording", () => {
    const viewerSource = readFileSync(
      join(repoRoot, "src/components/skills/skill-creator/assets/eval-viewer/viewer.html"),
      "utf-8",
    );

    assert.doesNotMatch(viewerSource, /Claude Code|告诉 Claude|回到 Claude/u);
    assert.match(viewerSource, /回到当前 CLI 会话告诉代理/u);
  });

  test("skill author agent uses source component filenames for authoring", () => {
    const skillAuthorSource = readFileSync(join(repoRoot, "src/components/agents/skill-author/index.ts"), "utf-8");

    assert.match(skillAuthorSource, /index\.ts、references、assets、evals、Procedure 引用/);
    assert.match(skillAuthorSource, /registry\.generated\.ts/);
    assert.doesNotMatch(
      skillAuthorSource,
      /SKILL\.body\.md|src\/components\/skills\/<skill>\/` 下的 SKILL\.md|写 SKILL\.md 时|README 索引项|\[SKILL\.md \//u,
      "skill author should describe source component files instead of generated SKILL.md output",
    );
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
      assert.doesNotMatch(
        source,
        /\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/u,
        `${readmeFile} should use platform-level procedures instead of skill-local scripts because README files are copied to dist`,
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

  test("copied skill markdown uses model-neutral actor wording", () => {
    const actorSpecificGuidance: string[] = [];
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );
    const claudeActorPattern =
      /Claude 阅读|Claude 应|Claude 会|Claude 需要|向 Claude|让 Claude|告诉 Claude|为 Claude|\buse Claude for\b/iu;

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        if (claudeActorPattern.test(line)) {
          actorSpecificGuidance.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      actorSpecificGuidance,
      [],
      "copied skill Markdown should not use Claude as the runtime actor; use model-neutral wording",
    );
  });

  test("component workflow declarations use the shared workflow API", () => {
    const legacyWorkflowHelpers: string[] = [];
    const legacyWorkflowTableMentions: string[] = [];
    const legacyExecutionStepTerms: string[] = [];
    const componentSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".ts") && !file.endsWith("sdk.ts"),
    );
    const workflowGuidanceSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md)$/u.test(file) &&
      /[\\/]src[\\/]components[\\/](?:skills|agents)[\\/]/u.test(file) &&
      !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of componentSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/\bdefine(?:Agent|Skill)Workflow(?:Step|Gate|Route)?\b/u.test(source)) {
        legacyWorkflowHelpers.push(relative(repoRoot, sourceFile));
      }
      if (/门禁表|场景路由表|分场景路由/u.test(source)) {
        legacyWorkflowTableMentions.push(relative(repoRoot, sourceFile));
      }
    }

    for (const sourceFile of workflowGuidanceSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/执行步骤/u.test(source)) {
        legacyExecutionStepTerms.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      legacyWorkflowHelpers,
      [],
      "component sources should use defineWorkflow* helpers so skills and agents share one workflow model",
    );
    assert.deepEqual(
      legacyWorkflowTableMentions,
      [],
      "component sources should model gates and routes through workflow nodes instead of describing legacy tables",
    );
    assert.deepEqual(
      legacyExecutionStepTerms,
      [],
      "skill and agent structured metadata should use shared workflow terminology instead of legacy execution-step wording",
    );
  });

  test("component guidance uses current skill ids instead of legacy expert routes", () => {
    const legacyExpertRoutes: string[] = [];
    const componentGuidanceFiles = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md|ya?ml)$/u.test(file) && !file.endsWith("registry.generated.ts"),
    );
    const legacyExpertRoutePattern =
      /\b(?:android|database|mysql|pgsql|speckit|skill)-expert(?::[a-z0-9-]+|\/[a-z0-9-]+)?\b/u;

    for (const sourceFile of componentGuidanceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyExpertRoutePattern);
      if (match) {
        legacyExpertRoutes.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyExpertRoutes,
      [],
      "component guidance should reference current skill ids instead of legacy expert route names",
    );
  });

  test("cross-platform skill guidance does not recommend Claude Code without Codex", () => {
    const platformBiasedAdvice: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components/skills"), (file) => file.endsWith(".md"))) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith(">")) return;
        if (/\b(?:Use|使用|优先使用)\s+Claude Code\b/u.test(line) && !/\bCodex\b/u.test(line)) {
          platformBiasedAdvice.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      platformBiasedAdvice,
      [],
      "cross-platform skill Markdown may quote Claude Code, but operational advice should include Codex or use neutral wording",
    );
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

  test("skill root readme/license links stay within skill root", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const escapedRootLinks: string[] = [];
    const missingLocalLinks: string[] = [];

    for (const skillEntry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const skillDir = join(skillRoot, skillEntry.name);
      for (const fileName of ["README.md", "LICENSE.txt"]) {
        const sourceFile = join(skillDir, fileName);
        if (!existsSync(sourceFile)) continue;
        const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
        for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
          if (match[1] === "!") continue;
          const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
        for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
          const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
      }
    }

    assert.deepEqual(
      escapedRootLinks,
      [],
      "skill root README/LICENSE local links should not escape the skill root; these docs are copied with the skill package",
    );
    assert.deepEqual(
      missingLocalLinks,
      [],
      "skill root README/LICENSE local links should point to files that exist in the same skill package",
    );
  });

  test("skill reference markdown links are relative to their file location", () => {
    const rootRelativeLinks: string[] = [];
    const referenceMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      rootRelativeLinks,
      [],
      "reference Markdown is copied into references/, so links to packaged references/assets must be relative from the current file",
    );
  });

  test("skill reference markdown links to generated skills only for registered skill sources", () => {
    const missingSkillLinks: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const collectSkillLinkTarget = (targetPath: string | null): void => {
        if (!targetPath) return;
        if (targetPath !== "../SKILL.md" && targetPath !== "./SKILL.md" && !targetPath.endsWith("/SKILL.md")) {
          return;
        }

        const targetSkillDir = dirname(resolve(dirname(sourceFile), targetPath));
        const relativeSkillDir = relative(skillSourceRoot, targetSkillDir);
        if (relativeSkillDir === "" || relativeSkillDir.startsWith("..")) return;
        if (!existsSync(join(targetSkillDir, "index.ts"))) {
          missingSkillLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(
      missingSkillLinks,
      [],
      "reference Markdown should not link to legacy sub-skill/plugin SKILL.md paths; link the real reference file or use plain text",
    );
  });

  test("skill reference markdown links to packaged assets only when the asset is registered", () => {
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const missingAssetLinks: string[] = [];
    const unregisteredAssetLinks: string[] = [];
    const assetTargetsBySkill = new Map<string, Set<string>>();

    for (const skill of registry.skills) {
      const targets = new Set<string>();
      for (const asset of skill.assets ?? []) {
        const target = asset.target ?? `assets/${basename(asset.source instanceof URL ? fileURLToPath(asset.source) : asset.source)}`;
        targets.add(target);
      }
      assetTargetsBySkill.set(skill.id, targets);
    }

    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const relativeSourceFile = relative(repoRoot, sourceFile);
      const skillId = relative(skillSourceRoot, sourceFile).split(/[\\/]/)[0];
      const assetTargets = assetTargetsBySkill.get(skillId) ?? new Set<string>();
      const collectAssetLinkTarget = (targetPath: string | null): void => {
        if (!targetPath || !targetPath.startsWith("../assets/")) return;

        const absoluteTarget = resolve(dirname(sourceFile), targetPath);
        const packagedTarget = targetPath.replace(/^\.\.\/assets\//u, "assets/");
        if (!existsSync(absoluteTarget)) {
          missingAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
        if (!assetTargets.has(packagedTarget)) {
          unregisteredAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(missingAssetLinks, [], "reference Markdown should not link to missing skill assets");
    assert.deepEqual(unregisteredAssetLinks, [], "linked skill assets must be registered through defineAsset");
  });

  test("skill markdown sources keep same-file heading anchors valid", () => {
    const brokenAnchors: string[] = [];
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const slugCounts = new Map<string, number>();
      const headingSlugs = new Set<string>();

      for (const line of source.split(/\r?\n/u)) {
        const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
        if (!heading) continue;

        const baseSlug = githubStyleHeadingSlug(heading[2]);
        if (!baseSlug) continue;

        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        headingSlugs.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
      }

      const sourceWithoutCodeFences = source.replace(/```[\s\S]*?```/gu, "");
      for (const match of sourceWithoutCodeFences.matchAll(/\[[^\]]+\]\((#[^)\s]+)\)/gu)) {
        const target = decodeMarkdownAnchor(match[1].slice(1)).toLowerCase();
        if (!headingSlugs.has(target)) {
          brokenAnchors.push(`${relative(repoRoot, sourceFile)}: missing #${target}`);
        }
      }
    }

    assert.deepEqual(
      brokenAnchors,
      [],
      "same-file markdown anchors should match generated heading slugs",
    );
  });

  test("procedure references use generated command tables instead of pseudo shell syntax", () => {
    const componentRuntimeDocs = [
      ...collectFiles(
        join(repoRoot, "src/components/skills"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
      ...collectFiles(
        join(repoRoot, "src/components/agents"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
    ];
    const pseudoProcedureReferences: string[] = [];
    const pseudoProcedurePattern = /`procedure\s+[a-z0-9-]+(?:\s[^`]*)?`|\bprocedure\s+`[a-z0-9-]+`/g;

    for (const sourceFile of componentRuntimeDocs) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(pseudoProcedurePattern)) {
        pseudoProcedureReferences.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      pseudoProcedureReferences,
      [],
      "procedure ids should be referenced as `<id> procedure`; runnable commands come from generated Procedure 调用说明",
    );
  });

  test("source skill script commands are backed by registered procedure targets", () => {
    const proceduresBySkillAndTarget = new Set(
      registry.procedures.flatMap((procedure) =>
        (procedure.owners.skillIds ?? []).map((skillId) => `${skillId}:${procedure.target ?? ""}`)
      ),
    );
    const unmappedScriptCommands: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const scriptCommandPattern = /\bnode\s+(?:\.\/)?scripts\/([A-Za-z0-9._/-]+\.mjs)\b/gu;

    for (const sourceFile of collectFiles(
      skillSourceRoot,
      (file) => file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    )) {
      const relativeSource = relative(skillSourceRoot, sourceFile);
      const skillId = relativeSource.split(/[\\/]/)[0];
      if (!skillId) continue;
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(scriptCommandPattern)) {
        const target = `scripts/${match[1]}`;
        if (!proceduresBySkillAndTarget.has(`${skillId}:${target}`)) {
          unmappedScriptCommands.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unmappedScriptCommands,
      [],
      "source skill Markdown may use short node scripts commands only when emitSkill can rewrite them to owned procedures",
    );
  });

  test("skill authoring guidance does not reintroduce skill-local scripts directories", () => {
    const authoringSources = [
      join(repoRoot, "src/components/agents/skill-author/index.ts"),
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/skills/skill-evolver/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evolver/references"), (file) =>
        file.endsWith(".md"),
      ),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references"), (file) =>
        file.endsWith(".md"),
      ),
    ];
    const legacyAuthoringScriptRefs: string[] = [];
    const legacyScriptPackagePattern = /scripts\/\*|`scripts\/`|scripts\/、|references\/scripts|scripts\/references|scripts、|脚手架资产（scripts/u;

    for (const sourceFile of authoringSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyScriptPackagePattern);
      if (match) {
        legacyAuthoringScriptRefs.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyAuthoringScriptRefs,
      [],
      "skill authoring guidance should route reusable code through procedures instead of skill-local scripts/ directories",
    );
  });

  test("skill creator authoring guidance uses cases yaml eval files", () => {
    const skillCreatorSources = [
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_eval.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_loop.ts"),
    ];
    const staleEvalSetRefs: string[] = [];

    for (const sourceFile of skillCreatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/evals\/evals\.json|--eval-set evals\.json/u.test(source)) {
        staleEvalSetRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(staleEvalSetRefs, [], "skill creator should default to evals/cases.yaml, not evals/evals.json");
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/index.ts"), "utf-8"),
      /evals\/cases\.yaml/,
    );
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/references/schemas.md"), "utf-8"),
      /cases:\n  - id:/,
    );
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

  test("hook source modules are all registered", () => {
    const hookRoot = join(repoRoot, "src/components/hooks");
    const hookSourceFiles = collectFiles(
      hookRoot,
      (file) => file.endsWith(".ts") && !file.endsWith("/index.ts") && !file.includes(`${join("hooks", "_shared")}${"/"}`),
    );
    const hookFilesWithDefinitions = hookSourceFiles
      .filter((file) => /export\s+const\s+[A-Za-z0-9_$]+\s*=\s*defineHook\s*\(/.test(readFileSync(file, "utf-8")))
      .map((file) => relative(repoRoot, file))
      .sort();
    const registeredHookFiles = registry.hooks
      .map((hook) => relative(repoRoot, hook.entry instanceof URL ? fileURLToPath(hook.entry) : hook.entry))
      .sort();

    assert.deepEqual(
      registeredHookFiles,
      hookFilesWithDefinitions,
      "every hook source that defines a hook should be registered through src/components/hooks/index.ts",
    );
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

  test("procedure sources do not contain source-side test modules", () => {
    const sourceSideTestModules = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /\.test\.ts$/.test(file) || /\bfrom\s+["']node:test["']/.test(source);
    }).map((file) => relative(repoRoot, file));

    assert.deepEqual(
      sourceSideTestModules,
      [],
      "procedure source tests should live under tests/ so they run with the project test suite",
    );
  });

  test("procedure source modules are registered entries or imported helpers", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function resolveRelativeProcedureImport(fromFile: string, specifier: string): string | null {
      const base = resolve(dirname(fromFile), specifier);
      const candidates = [
        base,
        `${base}.ts`,
        join(base, "index.ts"),
      ];
      return candidates.find((candidate) => existsSync(candidate)) ?? null;
    }

    const procedureSourceRoot = join(repoRoot, "src/components/procedures/sources");
    const procedureSources = collectFiles(
      procedureSourceRoot,
      (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
    );
    const registeredEntries = new Set(registry.procedures.map((procedure) => procedurePath(procedure.entry)));
    const importedHelpers = new Set<string>();

    for (const sourceFile of procedureSources) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(
        /\bfrom\s+["'](\.[^"']+)["']|\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
      )) {
        const specifier = match[1] ?? match[2];
        if (!specifier) continue;
        const resolved = resolveRelativeProcedureImport(sourceFile, specifier);
        if (resolved?.startsWith(procedureSourceRoot)) {
          importedHelpers.add(resolved);
        }
      }
    }

    const orphanedProcedureSources = procedureSources
      .filter((sourceFile) => !registeredEntries.has(sourceFile) && !importedHelpers.has(sourceFile))
      .map((sourceFile) => relative(repoRoot, sourceFile));

    assert.deepEqual(
      orphanedProcedureSources,
      [],
      "procedure source modules should either be registered runtime entries or imported helper modules",
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

  test("procedure sources do not suggest removed local script entrypoints", () => {
    const staleScriptSuggestions = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return [...source.matchAll(/\bRun node scripts\/[A-Za-z0-9._/-]+\.mjs\b/g)].map((match) =>
        `${relative(repoRoot, file)}: ${match[0]}`
      );
    });

    assert.deepEqual(
      staleScriptSuggestions,
      [],
      "procedure sources should tell users to run a procedure id, not a removed repository-local script",
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

    const generatedRegistrySource = readFileSync(
      join(repoRoot, "src/components/registry.generated.ts"),
      "utf-8",
    );
    assert.doesNotMatch(
      generatedRegistrySource,
      /from\s+"\.\/hooks\//,
      "registry.generated.ts should not import hooks; hooks are registered through src/components/hooks/index.ts",
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
        /from\s+["']\.[^"']+\.(?:ts|js)["']|import\s+["']\.[^"']+\.(?:ts|js)["']|import\(\s*["']\.[^"']+\.(?:ts|js)["']\s*\)/,
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
