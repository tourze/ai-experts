import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { test } from "vitest";
import { defaultReferenceTarget, toAbsolutePath } from "../../src/build/core.ts";
import { validateMermaidSyntax } from "../../src/build/mermaid.ts";
import { codexSystemSkillIds } from "../../src/build/platform.ts";
import { listProcedureUses, procedureUseAppliesToPlatform } from "../../src/build/procedure-uses.ts";
import { compactCodexOpenAiShortDescription } from "../../src/build/skills.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform, type SkillReferenceDefinition } from "../../src/components/sdk.ts";
import {
  assertSingleDispatcherHookGroups,
  collectFiles,
  countH2OutsideCodeFence,
  markdownDestination,
  repoRoot,
  stripFrontmatter,
  stripMarkdownCode,
} from "./test-helpers";
import {
  assertHookGroupTimeoutsMatchManifest,
  assertInstallManifestEntriesExist,
  buildComponents,
  collectMarkdownAnchors,
  collectMermaidCodeBlocks,
  collectSymlinks,
  countMarkdownTablePipes,
  decodeMarkdownAnchor,
  escapeRegExp,
  findRuntimeCommandsMissingPassthroughSeparator,
  getTmpDistDir,
  componentBuildSetupTimeoutMs,
  isLikelyLocalDefinitionPath,
  isMarkdownTableSeparator,
  normalizeMarkdownReferenceLabel,
  parseGeneratedToml,
  parseMarkdownFrontmatter,
  referenceDirectoryIndexTarget,
} from "./component-build.test-context";

export function registerComponentBuildRepresentativeTests(): void {
  test("renders representative skill/agent/instruction outputs", () => {
    const tsSkill = readFileSync(
      join(getTmpDistDir(), "claude/skills/typescript-type-safety/SKILL.md"),
      "utf-8",
    );
    assert.match(tsSkill, /name: typescript-type-safety/);
    assert.match(tsSkill, /Reference Map/);
    assert.doesNotMatch(tsSkill, /plugins\//);
    assert.equal(
      existsSync(join(getTmpDistDir(), "claude/skills/typescript-type-safety/references/advanced-patterns.md")),
      true,
    );

    const screenshotSkill = readFileSync(join(getTmpDistDir(), "codex/skills/screenshot/SKILL.md"), "utf-8");
    assert.match(screenshotSkill, /Procedure 调用说明/);
    assert.match(screenshotSkill, /### `screenshot-take-screenshot` — 截图主入口/);
    assert.match(screenshotSkill, /screenshot-take-screenshot/);
    assert.match(screenshotSkill, /截图主入口/);
    assert.match(screenshotSkill, /--path output\/screen\.png/);
    assert.match(screenshotSkill, /--active-window/);
    assert.match(screenshotSkill, /node ~\/\.codex\/procedures\.js/);
    assert.match(screenshotSkill, /--procedure-id screenshot-take-screenshot/);
    assert.match(screenshotSkill, /--trigger-skill screenshot/);
    assert.match(screenshotSkill, /--trigger-skill screenshot \\\n  -- \\\n  --mode/);
    assert.match(screenshotSkill, /何时调用/);
    assert.match(screenshotSkill, /参数/);
    assert.doesNotMatch(screenshotSkill, /node \.\.\/\.\.\/procedures\.js/);
    assert.doesNotMatch(screenshotSkill, /node scripts\/take_screenshot\.mjs/);

    const youtubeSearchSkill = readFileSync(join(getTmpDistDir(), "codex/skills/youtube-search/SKILL.md"), "utf-8");
    assert.match(youtubeSearchSkill, /'tailwindcss tutorial' --count 5 --sort views/);
    assert.doesNotMatch(youtubeSearchSkill, /\n  tailwindcss tutorial --count 5 --sort views/);

    const webContentFetcherSkill = readFileSync(join(getTmpDistDir(), "codex/skills/web-content-fetcher/SKILL.md"), "utf-8");
    assert.match(webContentFetcherSkill, /### `web-content-fetcher-fetch`/);
    assert.match(webContentFetcherSkill, /\| `\[url\]` \| URL \| 是 \| 要抓取正文的网页 URL/);
    assert.match(webContentFetcherSkill, /\| `\[max_chars\]` \| 数字 \| 否 \| 最大输出字符数/);
    assert.match(webContentFetcherSkill, /\| `--stealth` \| 布尔 \| 否 \| 使用更接近浏览器的请求头/);
    assert.match(webContentFetcherSkill, /\| `--json` \| 布尔 \| 否 \| 输出包含 URL、模式、选择器和 Markdown 的 JSON/);

    const remoteSshCommandSkill = readFileSync(join(getTmpDistDir(), "codex/skills/remote-ssh-command/SKILL.md"), "utf-8");
    assert.match(remoteSshCommandSkill, /### `remote-ssh-command-ssh-exec`/);
    assert.match(remoteSshCommandSkill, /\| `\[host-config\]` \| 路径 \| 是 \| 位于 ~\/\.host\/ 下的主机 JSON 配置文件路径/);
    assert.match(remoteSshCommandSkill, /\| `stdin` \| 字符串 \| 是 \| 要在远端执行的完整命令/);

    const codeReviewSkill = readFileSync(join(getTmpDistDir(), "codex/skills/code-review/SKILL.md"), "utf-8");
    assert.match(codeReviewSkill, /\| `\[target\]` \| 路径 \| 是 \| 要评估的源码文件或目录/);
    assert.match(codeReviewSkill, /\| `\[test-directory\]` \| 路径 \| 是 \| 要评估的测试目录/);

    const iconRetrievalSkill = readFileSync(join(getTmpDistDir(), "codex/skills/icon-retrieval/SKILL.md"), "utf-8");
    assert.match(iconRetrievalSkill, /'security shield' 3/);
    assert.match(iconRetrievalSkill, /\| `\[search_query\]` \| 字符串 \| 是 \| 图标搜索词/);
    assert.match(iconRetrievalSkill, /\| `\[topK\]` \| 数字 \| 否 \| 返回候选数量/);

    const architectureReviewerSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/architecture-reviewer/SKILL.md"),
      "utf-8",
    );
    assert.match(architectureReviewerSkill, /\| `\[codebase\]` \| 路径 \| 否 \| 要扫描的代码库目录/);

    const webPerformanceDiagnosisSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/web-performance-diagnosis/SKILL.md"),
      "utf-8",
    );
    assert.match(
      webPerformanceDiagnosisSkill,
      /\| `\[file-or-directory\]` \| 路径 \| 是 \| 要分析的 HTML 文件或目录/,
    );

    const i18nLocalizationSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/i18n-localization/SKILL.md"),
      "utf-8",
    );
    assert.match(i18nLocalizationSkill, /\| `\[target\]` \| 路径 \| 否 \| 要扫描的项目文件或目录/);

    const modelFirstReasoningSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/model-first-reasoning/SKILL.md"),
      "utf-8",
    );
    assert.match(modelFirstReasoningSkill, /\| `\[model_path\]` \| 路径 \| 是 \| 要校验的 model\.json 文件路径/);

    const agileProductOwnerSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/agile-product-owner/SKILL.md"),
      "utf-8",
    );
    assert.match(agileProductOwnerSkill, /\| `\[mode\]` \| 字符串 \| 否 \| 生成模式/);
    assert.match(agileProductOwnerSkill, /\| `\[capacity\]` \| 数字 \| 否 \| Sprint 容量点数/);

    const helmChartScaffoldingSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/helm-chart-scaffolding/SKILL.md"),
      "utf-8",
    );
    assert.match(helmChartScaffoldingSkill, /\| `\[chart_dir\]` \| 路径 \| 否 \| 要校验的 Helm Chart 目录/);

    const skillsPruneAndSyncReadmeSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/skills-prune-and-sync-readme/SKILL.md"),
      "utf-8",
    );
    assert.match(skillsPruneAndSyncReadmeSkill, /\| `\[command\]` \| 字符串 \| 是 \| 命令/);
    assert.match(skillsPruneAndSyncReadmeSkill, /\| `--format` \| 字符串 \| 否 \| audit 输出格式/);
    assert.match(skillsPruneAndSyncReadmeSkill, /\| `--yes` \| 布尔 \| 否 \| 确认执行 prune 删除操作/);

    const securityOwnershipMapSkill = readFileSync(
      join(getTmpDistDir(), "codex/skills/security-ownership-map/SKILL.md"),
      "utf-8",
    );
    assert.match(securityOwnershipMapSkill, /### `security-ownership-map-query-ownership`/);
    assert.match(securityOwnershipMapSkill, /\| `\[command\]` \| 字符串 \| 是 \| 查询命令/);
    assert.match(securityOwnershipMapSkill, /\| `--person` \| 字符串 \| 否 \| person 命令要查询/);
    assert.match(securityOwnershipMapSkill, /\| `--include-files` \| 布尔 \| 否 \| community 命令同时输出社区文件列表/);
    assert.match(securityOwnershipMapSkill, /### `security-ownership-map-run-ownership-map`/);
    assert.match(securityOwnershipMapSkill, /\| `--author-exclude-regex` \| 字符串 \| 否 \| 排除匹配正则的作者/);
    assert.match(securityOwnershipMapSkill, /\| `--cochange-min-jaccard` \| 数字 \| 否 \| 共改最小 Jaccard 系数/);

    const copywritingSkill = readFileSync(join(getTmpDistDir(), "codex/skills/copywriting/SKILL.md"), "utf-8");
    assert.match(copywritingSkill, /--text '这是一段待检测文案' --platform social-platform/);

    const speckitBaselineSkill = readFileSync(join(getTmpDistDir(), "codex/skills/speckit-baseline/SKILL.md"), "utf-8");
    assert.match(speckitBaselineSkill, /--short-name user-auth '用户登录功能'/);

    const iosSimulatorSkill = readFileSync(join(getTmpDistDir(), "codex/skills/ios-simulator-skill/SKILL.md"), "utf-8");
    assert.match(iosSimulatorSkill, /--udid '<device-udid>' --verbose/);

    assert.equal(existsSync(join(getTmpDistDir(), "codex/procedures.js")), true);
    assert.notEqual(statSync(join(getTmpDistDir(), "claude/procedures.js")).mode & 0o111, 0);
    assert.notEqual(statSync(join(getTmpDistDir(), "codex/procedures.js")).mode & 0o111, 0);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/run.js")), false);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/scripts")), false);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/skills/screenshot/assets/screenshot.png")), true);

    const shadcnSkill = readFileSync(join(getTmpDistDir(), "claude/skills/shadcn-ui/SKILL.md"), "utf-8");
    assert.match(shadcnSkill, /allowed-tools:\n  - mcp__shadcn__\*/);

    const speckitTaskstoissuesSkill = readFileSync(
      join(getTmpDistDir(), "claude/skills/speckit-taskstoissues/SKILL.md"),
      "utf-8",
    );
    assert.match(speckitTaskstoissuesSkill, /allowed-tools:\n  - mcp__github__issue_write/);

    const goTestingPatternsSkill = readFileSync(
      join(getTmpDistDir(), "claude/skills/go-testing-patterns/SKILL.md"),
      "utf-8",
    );
    assert.match(goTestingPatternsSkill, /## 相关 Skill/);
    assert.match(goTestingPatternsSkill, /\[通用测试模式\]\(\.\.\/testing-patterns\/SKILL\.md\)/);
    assert.match(goTestingPatternsSkill, /## 检查清单/);
    assert.ok(
      goTestingPatternsSkill.indexOf("## 反模式") < goTestingPatternsSkill.indexOf("## 检查清单"),
      "generated checklist should render after anti-patterns",
    );

    const structuredProblemSkill = readFileSync(
      join(getTmpDistDir(), "claude/skills/structured-problem-decomposition/SKILL.md"),
      "utf-8",
    );
    assert.match(structuredProblemSkill, /## 工作流/);
    assert.match(structuredProblemSkill, /```mermaid\nflowchart TD/);
    assert.match(structuredProblemSkill, /evidence-quality-framework/);
    assert.match(structuredProblemSkill, /选择工作流分支/);
    assert.doesNotMatch(structuredProblemSkill, /匹配场景路由/);
    assert.match(structuredProblemSkill, /debug-methodology/);
    assert.match(structuredProblemSkill, /fishbone-diagram/);
    assert.match(structuredProblemSkill, /pdca-cycle/);
    assert.match(structuredProblemSkill, /join --> compose_result/);

    const codeReviewAgentFrameworkSkill = readFileSync(
      join(getTmpDistDir(), "claude/skills/code-review-agent-framework/SKILL.md"),
      "utf-8",
    );
    assert.match(codeReviewAgentFrameworkSkill, /evidence_gate\["code-review/);
    assert.match(codeReviewAgentFrameworkSkill, /route\{"选择工作流分支"\}/);
    assert.match(codeReviewAgentFrameworkSkill, /complexity-reducer/);
    assert.match(codeReviewAgentFrameworkSkill, /test-quality-review/);
    assert.doesNotMatch(codeReviewAgentFrameworkSkill, /门禁表和按 diff 内容触发的场景路由表/);

    for (const platform of ["claude", "codex"]) {
      const t8Syntax = readFileSync(
        join(getTmpDistDir(), `${platform}/skills/data-storytelling/references/t8-syntax.md`),
        "utf-8",
      );
      assert.match(
        t8Syntax,
        /收入\[\+18%\]\(type=growth, unit=%\) 主要来自华东区域\[企业客户\]\(type=segment\)扩张。/,
        `${platform} reference rewriting should preserve fenced T8 syntax examples`,
      );
      assert.match(
        t8Syntax,
        /`\[企业客户\]\(type=segment\)`/,
        `${platform} reference rewriting should preserve inline T8 syntax examples`,
      );
      assert.match(
        t8Syntax,
        /^\[2026 Q1\]\(type=time\)\[收入\]\(type=metric\)\[\+18%\]\(type=growth\)$/m,
        `${platform} reference rewriting should preserve dense T8 anti-pattern examples`,
      );
    }

    const codexMetadata = readFileSync(
      join(getTmpDistDir(), "codex/skills/typescript-type-safety/agents/openai.yaml"),
      "utf-8",
    );
    assert.match(codexMetadata, /allow_implicit_invocation: true/);
    assert.match(tsSkill, /node ~\/\.claude\/procedures\.js/);
    assert.match(tsSkill, /--procedure-id typescript-type-safety-extract-ts-errors/);
    assert.match(tsSkill, /归组 tsc 错误/);
    assert.match(tsSkill, /tsc-output\.txt/);

    const claudeManifestWithScripts = JSON.parse(readFileSync(
      join(getTmpDistDir(), "claude/manifest.json"),
      "utf-8",
    ));
    assert.equal(claudeManifestWithScripts.procedures.proceduresFile, "procedures.js");
    assert.match(claudeManifestWithScripts.procedures.bundleChecksum, /^[a-f0-9]{64}$/);
    assert.equal(
      claudeManifestWithScripts.procedures.items.some((procedure: any) =>
        procedure.id === "screenshot-take-screenshot" &&
        procedure.target === "procedures.js" &&
        procedure.runtime === "node" &&
        procedure.bundled === true
      ),
      true,
    );
    assert.deepEqual(
      claudeManifestWithScripts.procedures.items.filter((procedure: any) => procedure.target !== "procedures.js"),
      [],
      "bundled procedure manifest entries should point at the generated bundle, not removed per-script files",
    );
    assert.equal(
      claudeManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-eval"),
      true,
      "Claude should include Claude trigger-eval procedures",
    );
    assert.equal("scripts" in claudeManifestWithScripts, false);

    const codexManifestWithScripts = JSON.parse(readFileSync(
      join(getTmpDistDir(), "codex/manifest.json"),
      "utf-8",
    ));
    assert.equal(
      codexManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-eval"),
      false,
      "Codex should not expose Claude trigger-eval procedures",
    );
    assert.equal(
      codexManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-loop"),
      false,
      "Codex should not expose Claude trigger-optimization loops",
    );
    assert.deepEqual(
      codexManifestWithScripts.procedures.items
        .map((procedure: any) => procedure.id)
        .filter((procedureId: string) => procedureId.startsWith("skill-creator-")),
      [],
      "Codex should use the system skill-creator instead of bundling custom skill-creator procedures",
    );
    assert.equal(existsSync(join(getTmpDistDir(), "claude/skills/skill-creator/assets/eval-viewer/viewer.html")), true);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/skills/skill-creator/assets/eval-viewer/viewer.html")), false);
    for (const systemSkillId of codexSystemSkillIds) {
      assert.equal(
        existsSync(join(getTmpDistDir(), "codex/skills", systemSkillId)),
        false,
        `Codex dist should not emit user skill directories for system skill ${systemSkillId}`,
      );
    }
    const codexSkillAuthor = readFileSync(join(getTmpDistDir(), "codex/agents/skill-author.toml"), "utf-8");
    assert.doesNotMatch(codexSkillAuthor, /skill-creator-run-eval|skill-creator-run-loop/);
    for (const codexAgentFile of collectFiles(join(getTmpDistDir(), "codex/agents"), (file) => file.endsWith(".toml"))) {
      const source = readFileSync(codexAgentFile, "utf-8");
      for (const systemSkillId of codexSystemSkillIds) {
        assert.doesNotMatch(
          source,
          new RegExp(`~\\/\\.agents\\/skills\\/${escapeRegExp(systemSkillId)}\\/SKILL\\.md`, "u"),
          `${relative(getTmpDistDir(), codexAgentFile)} should not path-link Codex system skill ${systemSkillId}`,
        );
      }
    }
    const claudeSkillEvolver = readFileSync(join(getTmpDistDir(), "claude/skills/skill-evolver/SKILL.md"), "utf-8");
    const codexSkillEvolver = readFileSync(join(getTmpDistDir(), "codex/skills/skill-evolver/SKILL.md"), "utf-8");
    assert.match(claudeSkillEvolver, /\[Skill Creator\]\(\.\.\/skill-creator\/SKILL\.md\)/);
    assert.doesNotMatch(codexSkillEvolver, /\[Skill Creator\]\(\.\.\/skill-creator\/SKILL\.md\)/);

    const claudeAgent = readFileSync(join(getTmpDistDir(), "claude/agents/typescript-reviewer.md"), "utf-8");
    assert.match(claudeAgent, /name: typescript-reviewer/);
    assert.match(claudeAgent, /tools: Read, Grep, Glob, Bash, Skill/);
    assert.match(claudeAgent, /skills:\n  - typescript-type-safety\nmodel: sonnet/);
    assert.match(claudeAgent, /model: sonnet\neffort: high/);
    assert.match(claudeAgent, /你是资深 TypeScript 工程师/);
    assert.match(claudeAgent, /`debug-methodology` \(route\)/);
    assert.match(
      claudeAgent,
      /当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。/,
    );

    const typescriptEngineerAgent = readFileSync(
      join(getTmpDistDir(), "claude/agents/typescript-engineer.md"),
      "utf-8",
    );
    assert.match(typescriptEngineerAgent, /## Bash 使用边界/);
    assert.match(typescriptEngineerAgent, /## 工作流/);
    assert.match(typescriptEngineerAgent, /```mermaid\nflowchart TD/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 工作流") < typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent workflow should stay before quality standards",
    );
    assert.ok(
      typescriptEngineerAgent.indexOf("## Bash 使用边界") < typescriptEngineerAgent.indexOf("## 输出格式"),
      "generated agent Bash boundary should stay near the operational guidance sections",
    );
    assert.match(typescriptEngineerAgent, /# TypeScript 工程报告：<scope>/);
    assert.match(typescriptEngineerAgent, /## 质量标准/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 输出格式") < typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent quality standards should stay after agent-specific output guidance",
    );

    const productDiscovererAgent = readFileSync(
      join(getTmpDistDir(), "claude/agents/product-discoverer.md"),
      "utf-8",
    );
    assert.doesNotMatch(
      productDiscovererAgent,
      /## Bash 使用边界/,
      "agents without KnownTool.Bash should not emit Bash boundary instructions",
    );

    const androidReviewerAgent = readFileSync(join(getTmpDistDir(), "claude/agents/android-reviewer.md"), "utf-8");
    assert.doesNotMatch(androidReviewerAgent, /## 质量标准/, "agents without qualityStandards should not emit quality standards");
    assert.doesNotMatch(claudeAgent, /## 输出格式/, "agents without outputFormat should not emit output format instructions");
    const analyzerAgent = readFileSync(join(getTmpDistDir(), "claude/agents/eval-post-hoc-analyzer.md"), "utf-8");
    assert.doesNotMatch(analyzerAgent, /Analyzing Benchmark Results/, "analyzer should keep a single output format and one responsibility");
    assert.doesNotMatch(analyzerAgent, /## 技能编排/, "agents without skills should not emit empty skill routing");

    const goReviewerAgent = readFileSync(join(getTmpDistDir(), "claude/agents/go-reviewer.md"), "utf-8");
    assert.match(goReviewerAgent, /## 工作流/);
    assert.match(goReviewerAgent, /```mermaid\nflowchart TD/);
    assert.match(goReviewerAgent, /选择工作流分支/);
    assert.doesNotMatch(goReviewerAgent, /匹配场景路由/);
    assert.match(goReviewerAgent, /go-concurrency-patterns/);

    const windowsReviewerAgent = readFileSync(
      join(getTmpDistDir(), "claude/agents/windows-platform-reviewer.md"),
      "utf-8",
    );
    assert.match(windowsReviewerAgent, /evidence-quality-framework/);
    assert.match(windowsReviewerAgent, /route\{"选择工作流分支"\}/);
    assert.match(windowsReviewerAgent, /windows-kernel-security/);
    assert.match(windowsReviewerAgent, /windows-ui-automation/);
    assert.match(windowsReviewerAgent, /prlctl-vm-control/);
    assert.doesNotMatch(windowsReviewerAgent, /分场景路由/);
    assert.deepEqual(
      parseMarkdownFrontmatter(join(getTmpDistDir(), "claude/agents/windows-platform-reviewer.md")).skills,
      ["windows-kernel-security", "windows-ui-automation", "evidence-quality-framework"],
      "Claude agents should not preload explicit-only skills that disable model invocation",
    );

    const codexAgent = readFileSync(join(getTmpDistDir(), "codex/agents/frontend-engineer.toml"), "utf-8");
    assert.match(codexAgent, /name = "frontend-engineer"/);
    assert.doesNotMatch(codexAgent, /model = "sonnet"/);
    assert.match(codexAgent, /sandbox_mode = "workspace-write"/);
    assert.match(codexAgent, /你是资深 Web 前端工程师/);
    assert.match(codexAgent, /## 技能编排/);
    assert.match(codexAgent, /\[\[skills\.config\]\]\npath = "~\/.agents\/skills\/modern-web-design\/SKILL\.md"\nenabled = true/);
    assert.match(codexAgent, /## Bash 使用边界/);
    assert.match(codexAgent, /# 前端工程报告：<scope>/);
    assert.match(codexAgent, /## 质量标准/);
    assert.match(codexAgent, /developer_instructions = '''\n/);

    const codexWebmanAgent = readFileSync(join(getTmpDistDir(), "codex/agents/webman-reviewer.toml"), "utf-8");
    assert.match(codexWebmanAgent, /developer_instructions = '''\n/);
    assert.match(codexWebmanAgent, /Illuminate\\Database/);

    const claudeInstructions = readFileSync(join(getTmpDistDir(), "claude/CLAUDE.md"), "utf-8");
    const expectedInstructionSections = [
      "## 使用原则",
      "## 通用行为协议",
      "## 任务执行协议",
      "## 安全与交付门禁",
      "## 沟通与输出协议",
      "## 复杂报告模板",
    ];
    assert.match(claudeInstructions, /^# 本地 AI 能力使用指南\n/);
    assert.doesNotMatch(claudeInstructions.slice(0, 220), /# ai-experts|你正在使用|ai-experts/);
    let previousInstructionSectionIndex = -1;
    for (const section of expectedInstructionSections) {
      const sectionIndex = claudeInstructions.indexOf(section);
      assert.notEqual(sectionIndex, -1, `missing instruction section: ${section}`);
      assert.ok(
        sectionIndex > previousInstructionSectionIndex,
        `instruction section should be ordered after previous section: ${section}`,
      );
      previousInstructionSectionIndex = sectionIndex;
    }
    assert.doesNotMatch(claudeInstructions, /可用能力索引|Skill 索引|Agent 索引|frontend-engineer/);
    assert.doesNotMatch(claudeInstructions, /组件运行模型|组件源码边界|Procedure 运行时|生成画像|Hook 索引/);

    const codexInstructions = readFileSync(join(getTmpDistDir(), "codex/AGENTS.md"), "utf-8");
    assert.match(codexInstructions, /^# 本地 AI 能力使用指南\n/);
    assert.doesNotMatch(codexInstructions.slice(0, 220), /# ai-experts|你正在使用|ai-experts/);
    assert.match(codexInstructions, /## 使用原则/);
    assert.match(codexInstructions, /## 任务执行协议/);
    assert.match(codexInstructions, /## Codex Skill 路由补充/);
    assert.match(codexInstructions, /~\/\.agents\/skills\/\*\/SKILL\.md/);
    assert.match(codexInstructions, /## Agent 索引/);
    assert.match(codexInstructions, /frontend-engineer/);
    assert.doesNotMatch(codexInstructions, /可用能力索引|Skill 索引|typescript-type-safety/);
    assert.doesNotMatch(codexInstructions, /组件运行模型|组件源码边界|Procedure 运行时|生成画像|Hook 索引/);

    for (const platformName of ["claude", "codex"]) {
      const skillFiles = collectFiles(join(getTmpDistDir(), platformName, "skills"))
        .filter((file) => file.endsWith("/SKILL.md"));
      for (const skillFile of skillFiles) {
        const skillSource = readFileSync(skillFile, "utf-8");
        assert.doesNotMatch(
          skillSource,
          /\n{3,}/,
          `${skillFile} should not contain repeated blank lines`,
        );
      }

      const skillMarkdownFiles = collectFiles(join(getTmpDistDir(), platformName, "skills"))
        .filter((file) => file.endsWith(".md"));
      for (const skillFile of skillMarkdownFiles) {
        const skillSource = readFileSync(skillFile, "utf-8");
        assert.doesNotMatch(
          skillSource,
          /node \.\.\/\.\.\/procedures\.js/,
          `${skillFile} should not render invalid relative procedure runtime paths`,
        );
        assert.doesNotMatch(
          skillSource,
          /node\s+<runtime-root>\/procedures\.js/,
          `${skillFile} should render concrete platform procedure runtime paths`,
        );
        assert.doesNotMatch(
          skillSource,
          /node\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs/,
          `${skillFile} should not render legacy local script commands`,
        );
      }
    }
  });

}
