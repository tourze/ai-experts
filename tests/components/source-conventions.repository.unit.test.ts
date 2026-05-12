import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, test } from "vitest";
import { toAbsolutePath } from "../../src/build/core.ts";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform, type RuleDefinition } from "../../src/components/sdk.ts";
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

function ruleBodyText(rule: RuleDefinition): string {
  if (rule.body instanceof URL || typeof rule.body === "string") {
    return readFileSync(toAbsolutePath(rule.body), "utf-8");
  }
  return rule.body.lines.join("\n");
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


describe("component source repository conventions", () => {
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
      `${registry.hooks.length} 个 hook、${registry.procedures.length} 个 procedure、${registry.rules.length} 个 rule`;
    const claudeHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Claude)).length;
    const codexHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Codex)).length;
    const claudeSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Claude)).length;
    const codexSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length;
    const claudeProcedureCount = collectPlatformProcedures(componentSurface, Platform.Claude).length;
    const codexProcedureCount = collectPlatformProcedures(componentSurface, Platform.Codex).length;
    const claudeRuleCount = registry.rules.filter((rule) => rule.platforms.includes(Platform.Claude)).length;
    const codexRuleCount = registry.rules.filter((rule) => rule.platforms.includes(Platform.Codex)).length;
    const gateSummary =
      `- \`dist/claude\` 生成 ${claudeSkillCount} 个 skill、${registry.agents.length} 个 agent、${claudeHookCount} 个 hook、${claudeProcedureCount} 个 procedure 和 ${claudeRuleCount} 个 rule；` +
      `\`dist/codex\` 生成 ${codexSkillCount} 个 skill、${registry.agents.length} 个 agent、${codexHookCount} 个 hook、${codexProcedureCount} 个 procedure 和 ${codexRuleCount} 个 rule`;

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
    assert.match(readme, /`manifest\.json` 当前使用 schema 6/);
    assert.match(readme, /`install` 字段是安装器的一等事实源/);
    assert.match(readme, /`skillEntries` 从 `skillSourceRoot` 映射到 `skillRoot`/);
    assert.match(readme, /`forbiddenRootEntries` 与 `forbiddenSkillEntries`/);
    assert.match(readme, /Codex 的 `configRoot` 是 `~\/\.codex`、`skillRoot` 是 `~\/\.agents\/skills`/);
    assert.match(readme, /Codex 的 `rootEntries` 不包含 `skills\/` 或 `rules\/`/);
    assert.match(readme, /Codex 官方 `rules\/` 是 shell approval \/ exec policy，不能用于本项目的上下文 Rule/);
    assert.match(readme, /`context-rules\/`/);
    assert.match(readme, /Rule 是短上下文规则，只承载稳定、按用户项目路径命中的本地指导/);
    assert.match(readme, /目标读者是最终运行时的 agent，而不是维护 `src\/components\/` 的仓库作者/);
    assert.match(readme, /Rule 不能写成组件源码维护说明、dist 生成说明或 skill\/agent 索引说明/);
    assert.match(readme, /语言类 Rule 应匹配真实用户代码文件/);
    assert.match(readme, /Rule body 使用 `defineRuleBody\(\{ lines \}\)` 内联定义，不新增 `RULE\.body\.md`/);
    assert.match(readme, /需要 Node\.js >= 20\.19\.0/);
    assert.match(readme, /^\s+rules\/<rule>\/$/m);
    assert.match(readme, /^\s+context-rules\/$/m);
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

  test("README local markdown links resolve", () => {
    const readmePath = join(repoRoot, "README.md");
    const readme = stripMarkdownCode(readFileSync(readmePath, "utf-8"));
    const brokenLocalLinks: string[] = [];

    const collectBrokenLink = (destination: string): void => {
      if (!isLikelyLocalDefinitionPath(destination)) return;
      const targetPath = localMarkdownPath(markdownDestination(destination));
      if (!targetPath) return;
      const resolvedTarget = resolve(dirname(readmePath), targetPath);
      if (!existsSync(resolvedTarget)) {
        brokenLocalLinks.push(targetPath);
      }
    };

    for (const match of readme.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
      collectBrokenLink(match[1] ?? "");
    }
    for (const match of readme.matchAll(/^\s*\[[^\]\n]+\]:\s+([^\n]+)$/gmu)) {
      collectBrokenLink(match[1] ?? "");
    }

    assert.deepEqual(
      brokenLocalLinks,
      [],
      "README local Markdown links should resolve from repository root",
    );
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
    const ruleDirs = readdirSync(join(repoRoot, "src/components/rules"), { withFileTypes: true })
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
    assert.deepEqual(
      ruleDirs,
      registry.rules.map((rule) => rule.id).sort(),
      "every rule source directory should be registered and every registered rule should have a source directory",
    );
  });

  test("context rules target runtime project files instead of component maintenance internals", () => {
    const internalRulePaths: string[] = [];
    const internalRuleBodies: string[] = [];
    const fileBodyRules: string[] = [];
    const forbiddenPathPattern = /^(?:src\/components|src\/build|tests|dist)(?:\/|$)|^README\.md$/u;
    const forbiddenBodyPattern =
      /src\/components|src\/build|dist\/(?:claude|codex)|生成契约|组件源码|skill\/agent 索引|维护 .*skills?\/agents?/iu;

    for (const rule of registry.rules) {
      if (!(typeof rule.body === "object" && rule.body !== null && !(rule.body instanceof URL) && Array.isArray(rule.body.lines))) {
        fileBodyRules.push(rule.id);
      }
      for (const pathGlob of rule.paths) {
        if (forbiddenPathPattern.test(pathGlob)) {
          internalRulePaths.push(`${rule.id}: ${pathGlob}`);
        }
      }
      const body = ruleBodyText(rule);
      if (forbiddenBodyPattern.test(body)) {
        internalRuleBodies.push(rule.id);
      }
    }

    assert.deepEqual(
      fileBodyRules,
      [],
      "rules should define short runtime context inline with defineRuleBody({ lines }), not RULE.body.md files",
    );
    assert.deepEqual(
      internalRulePaths,
      [],
      "rules should match runtime project files, not ai-experts component/build/test maintenance paths",
    );
    assert.deepEqual(
      internalRuleBodies,
      [],
      "rules should describe language/runtime coding constraints, not component source or dist generation maintenance",
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

  test("runtime sources do not reintroduce legacy plugin-root compatibility paths", () => {
    const legacyPluginRootMentions: string[] = [];
    const runtimeSourceFiles = [
      ...collectFiles(join(repoRoot, "src/build"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts")),
    ];
    const legacyPattern =
      /\bisLegacyPluginsRoot\b|\blegacyPluginsRoot\b|~\/\.claude\/plugins\b|~\/\.codex\/plugins\b|~\/\.codex\/skills\b/u;

    for (const sourceFile of runtimeSourceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      if (legacyPattern.test(source)) {
        legacyPluginRootMentions.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      legacyPluginRootMentions,
      [],
      "runtime source code should only target canonical configRoot/skillRoot and must not keep legacy plugin-root or ~/.codex/skills compatibility branches",
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

});
