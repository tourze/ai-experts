import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { afterAll, beforeAll, describe, test } from "vitest";
import {
  assertSingleDispatcherHookGroups,
  collectFiles,
  countH2OutsideCodeFence,
  extractRelativeRuntimeSpecifiers,
  repoRoot,
  stripFrontmatter,
} from "./test-helpers";

let tmpDistDir = "";

beforeAll(() => {
  tmpDistDir = mkdtempSync(join(tmpdir(), "ai-experts-component-build-"));

  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  assert.equal(existsSync(join(repoRoot, "scripts")), false);
  assert.equal(existsSync(join(repoRoot, "scripts/build-components.mjs")), false);
  assert.equal(existsSync(join(repoRoot, "src/build-components.ts")), false);
  assert.equal(existsSync(join(repoRoot, "src/build-components")), false);
  assert.match(packageJson.scripts["build:components"], /src\/build\.ts/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /scripts\/build-components/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /src\/build-components/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /build-components\.mjs/);

  execFileSync(
    process.execPath,
    ["--import", "tsx/esm", "src/build.ts", "--out-dir", tmpDistDir],
    { cwd: repoRoot, encoding: "utf-8" },
  );
});

afterAll(() => {
  if (tmpDistDir) {
    rmSync(tmpDistDir, { recursive: true, force: true });
  }
});

describe("component build integration", () => {
  test("emits claude/codex manifests and core component counts", () => {
    const claudeManifest = JSON.parse(readFileSync(join(tmpDistDir, "claude/manifest.json"), "utf-8"));
    const codexManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/manifest.json"), "utf-8"));

    assert.equal(claudeManifest.skills.length, 338);
    assert.equal(codexManifest.skills.length, 338);
    assert.equal(claudeManifest.agents.length, 80);
    assert.equal(codexManifest.agents.length, 80);
    assert.equal(claudeManifest.hooks.length, 99);
    assert.equal(codexManifest.hooks.length, 99);
  });

  test("renders representative skill/agent/instruction outputs", () => {
    const tsSkill = readFileSync(
      join(tmpDistDir, "claude/skills/typescript-type-safety/SKILL.md"),
      "utf-8",
    );
    assert.match(tsSkill, /name: typescript-type-safety/);
    assert.match(tsSkill, /Reference Map/);
    assert.doesNotMatch(tsSkill, /plugins\//);
    assert.equal(
      existsSync(join(tmpDistDir, "claude/skills/typescript-type-safety/references/advanced-patterns.md")),
      true,
    );

    const screenshotSkill = readFileSync(join(tmpDistDir, "codex/skills/screenshot/SKILL.md"), "utf-8");
    assert.match(screenshotSkill, /Script Registry/);
    assert.match(screenshotSkill, /screenshot-take-screenshot/);
    assert.equal(existsSync(join(tmpDistDir, "codex/run.js")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/scripts/screenshot/take_screenshot.mjs")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/skills/screenshot/assets/screenshot.png")), true);

    const goTestingPatternsSkill = readFileSync(
      join(tmpDistDir, "claude/skills/go-testing-patterns/SKILL.md"),
      "utf-8",
    );
    assert.match(goTestingPatternsSkill, /## 相关 Skill/);
    assert.match(goTestingPatternsSkill, /\[testing-patterns\]\(\.\.\/testing-patterns\/SKILL\.md\)/);
    assert.match(goTestingPatternsSkill, /## 检查清单/);
    assert.ok(
      goTestingPatternsSkill.indexOf("## 检查清单") < goTestingPatternsSkill.indexOf("## 反模式"),
      "generated checklist should keep its pre-anti-pattern position",
    );

    const codexMetadata = readFileSync(
      join(tmpDistDir, "codex/skills/typescript-type-safety/agents/openai.yaml"),
      "utf-8",
    );
    assert.match(codexMetadata, /allow_implicit_invocation: true/);

    const claudeManifestWithScripts = JSON.parse(readFileSync(
      join(tmpDistDir, "claude/manifest.json"),
      "utf-8",
    ));
    assert.equal(claudeManifestWithScripts.scripts.runFile, "run.js");
    assert.match(claudeManifestWithScripts.scripts.runBundleChecksum, /^[a-f0-9]{64}$/);
    assert.equal(
      claudeManifestWithScripts.scripts.items.some((script: any) =>
        script.id === "screenshot-take-screenshot" && script.runtime === "node"
      ),
      true,
    );

    const claudeAgent = readFileSync(join(tmpDistDir, "claude/agents/typescript-reviewer.md"), "utf-8");
    assert.match(claudeAgent, /name: typescript-reviewer/);
    assert.match(claudeAgent, /skills:\n  - typescript-type-safety\n  - debug-methodology/);
    assert.match(claudeAgent, /model: sonnet\neffort: high/);
    assert.match(claudeAgent, /你是资深 TypeScript 工程师/);
    assert.match(claudeAgent, /`debug-methodology` \(route\)/);

    const typescriptEngineerAgent = readFileSync(
      join(tmpDistDir, "claude/agents/typescript-engineer.md"),
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
      join(tmpDistDir, "claude/agents/product-discoverer.md"),
      "utf-8",
    );
    assert.doesNotMatch(
      productDiscovererAgent,
      /## Bash 使用边界/,
      "agents without KnownTool.Bash should not emit Bash boundary instructions",
    );

    const analyzerAgent = readFileSync(join(tmpDistDir, "claude/agents/eval-post-hoc-analyzer.md"), "utf-8");
    assert.doesNotMatch(analyzerAgent, /## 质量标准/, "agents without qualityStandards should not emit quality standards");
    assert.doesNotMatch(claudeAgent, /## 输出格式/, "agents without outputFormat should not emit output format instructions");
    assert.doesNotMatch(analyzerAgent, /Analyzing Benchmark Results/, "analyzer should keep a single output format and one responsibility");

    const goReviewerAgent = readFileSync(join(tmpDistDir, "claude/agents/go-reviewer.md"), "utf-8");
    assert.match(goReviewerAgent, /## 工作流/);
    assert.match(goReviewerAgent, /```mermaid\nflowchart TD/);
    assert.match(goReviewerAgent, /匹配场景路由/);
    assert.match(goReviewerAgent, /go-concurrency-patterns/);

    const codexAgent = readFileSync(join(tmpDistDir, "codex/agents/frontend-engineer.toml"), "utf-8");
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

    const codexWebmanAgent = readFileSync(join(tmpDistDir, "codex/agents/webman-reviewer.toml"), "utf-8");
    assert.match(codexWebmanAgent, /developer_instructions = '''\n/);
    assert.match(codexWebmanAgent, /Illuminate\\Database/);

    const claudeInstructions = readFileSync(join(tmpDistDir, "claude/CLAUDE.md"), "utf-8");
    assert.match(claudeInstructions, /Runtime Model/);
    assert.match(claudeInstructions, /frontend-engineer/);
    assert.match(claudeInstructions, /component-routing-reminder/);

    const codexInstructions = readFileSync(join(tmpDistDir, "codex/AGENTS.md"), "utf-8");
    assert.match(codexInstructions, /Source of truth: src\/components\//);
  });

  test("provides unified run.js protocol with normalized JSON output", () => {
    const runPath = join(tmpDistDir, "claude/run.js");
    assert.equal(existsSync(runPath), true);

    const missingScriptId = JSON.parse(execFileSync(process.execPath, [runPath], { encoding: "utf-8" }));
    assert.equal(missingScriptId.ok, false);
    assert.equal(missingScriptId.error.code, "RUNNER_ERROR");
    assert.match(missingScriptId.error.message, /--script-id is required/);

    const unknownScript = JSON.parse(execFileSync(process.execPath, [
      runPath,
      "--script-id",
      "not-exists",
      "--trigger-skill",
      "debug-methodology",
    ], { encoding: "utf-8" }));
    assert.equal(unknownScript.ok, false);
    assert.match(unknownScript.error.message, /script not found/);

    const ownerMismatch = JSON.parse(execFileSync(process.execPath, [
      runPath,
      "--script-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "screenshot",
      "--request-json",
      "{\"args\":[\"--title\",\"owner-mismatch\"]}",
    ], { encoding: "utf-8" }));
    assert.equal(ownerMismatch.ok, false);
    assert.match(ownerMismatch.error.message, /not callable by trigger skill/);

    const invalidJson = JSON.parse(execFileSync(process.execPath, [
      runPath,
      "--script-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--request-json",
      "{not-json}",
    ], { encoding: "utf-8" }));
    assert.equal(invalidJson.ok, false);
    assert.match(invalidJson.error.message, /Unexpected token|JSON/i);

    const success = JSON.parse(execFileSync(process.execPath, [
      runPath,
      "--script-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--session-id",
      "fixture-session",
      "--request-json",
      "{\"args\":[\"--title\",\"fixture-checklist\"]}",
    ], { encoding: "utf-8" }));
    assert.equal(success.ok, true);
    assert.equal(success.scriptId, "debug-methodology-debug-checklist");
    assert.equal(success.sessionId, "fixture-session");
    assert.equal(success.trigger.skillId, "debug-methodology");
    assert.equal(success.error, null);
    assert.equal(typeof success.timingMs, "number");
    assert.match(success.result.stdout, /Debug Checklist: fixture-checklist/);

    const executionFailure = JSON.parse(execFileSync(process.execPath, [
      runPath,
      "--script-id",
      "web-content-fetcher-fetch",
      "--trigger-skill",
      "web-content-fetcher",
      "--request-json",
      "{\"args\":[\"--invalid\"]}",
    ], { encoding: "utf-8" }));
    assert.equal(executionFailure.ok, false);
    assert.equal(executionFailure.error.code, "SCRIPT_EXECUTION_FAILED");
    assert.equal(typeof executionFailure.result.exitCode, "number");
  });

  test("generates clean script artifacts with valid runtime imports", () => {
    for (const platform of ["claude", "codex"]) {
      assert.equal(
        collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
          /[\\/]skills[\\/][^\\/]+[\\/]index\.js$/.test(file),
        ).length,
        0,
        `${platform} skill dist should not include compiled component index.js files`,
      );
    }

    const sourceMjsSkillScripts = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs"),
    );
    assert.deepEqual(sourceMjsSkillScripts, [], "skill script source files should use TypeScript");

    const generatedTsSkillScripts = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".ts"),
    );
    assert.deepEqual(generatedTsSkillScripts, [], "generated skill scripts should not copy TypeScript source files");

    const generatedMjsScripts = collectFiles(join(tmpDistDir, "claude/scripts"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs"),
    );

    const legacySkillScriptRunners = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      /[\\/]scripts[\\/]run\.mjs$/.test(file),
    );
    const legacySkillScriptManifests = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      /[\\/]scripts[\\/]manifest\.json$/.test(file),
    );
    assert.deepEqual(legacySkillScriptRunners, [], "legacy per-skill scripts/run.mjs should not be generated");
    assert.deepEqual(legacySkillScriptManifests, [], "legacy per-skill scripts/manifest.json should not be generated");

    const withExtensionlessImports = generatedMjsScripts.filter((file) => {
      const source = readFileSync(file, "utf-8");
      return extractRelativeRuntimeSpecifiers(source).some((specifier) => {
        const leaf = specifier.split("/").at(-1) ?? "";
        return extname(leaf) === "";
      });
    });
    assert.deepEqual(
      withExtensionlessImports,
      [],
      "generated .mjs scripts should keep Node-resolvable relative import extensions",
    );

    const withMissingRelativeImports = generatedMjsScripts.flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return extractRelativeRuntimeSpecifiers(source)
        .map((specifier) => join(dirname(file), specifier))
        .filter((target) => !existsSync(target));
    });
    assert.deepEqual(withMissingRelativeImports, [], "generated .mjs scripts should only import files that exist in dist");

    const withDuplicateShebangs = generatedMjsScripts.filter((file) => {
      const shebangLines = readFileSync(file, "utf-8").split(/\r?\n/).filter((line) => line.startsWith("#!"));
      return shebangLines.length > 1;
    });
    assert.deepEqual(withDuplicateShebangs, [], "generated .mjs scripts should not contain duplicate shebangs");
  });

  test("wires hook dispatchers and runtime guard behaviors", () => {
    const claudeSettings = JSON.parse(readFileSync(join(tmpDistDir, "claude/settings.json"), "utf-8"));
    const codexHooksConfig = JSON.parse(readFileSync(join(tmpDistDir, "codex/hooks.json"), "utf-8"));

    assert.equal(claudeSettings.hooks.UserPromptSubmit[0].hooks[0].type, "command");
    assert.match(claudeSettings.hooks.PostToolUse[0].matcher, /apply_patch/);
    assertSingleDispatcherHookGroups(claudeSettings, "claude settings");
    assertSingleDispatcherHookGroups(codexHooksConfig, "codex hooks");
    assert.equal(claudeSettings.hooks.PostToolUse[0].hooks.length, 1);
    assert.equal(codexHooksConfig.hooks.PostToolUse[0].hooks.length, 1);

    const codexConfig = readFileSync(join(tmpDistDir, "codex/config.toml"), "utf-8");
    assert.match(codexConfig, /codex_hooks = true/);

    const hookManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/hooks/manifest.json"), "utf-8"));
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "component-routing-reminder"), true);
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "dangerous-command-guard"), true);
    assert.equal(existsSync(join(tmpDistDir, "claude/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmpDistDir, "claude/hooks/modules")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/hooks/modules")), false);
    assert.equal(hookManifest.hooks.some((hook: any) => "module" in hook), false);
    assert.equal(hookManifest.hooks.some((hook: any) => /(?:expert|plugin)/.test(hook.id)), false);
    assert.doesNotMatch(readFileSync(join(tmpDistDir, "claude/hooks/dispatch.mjs"), "utf-8"), /(?:expert|plugin)/);
    assert.doesNotMatch(readFileSync(join(tmpDistDir, "codex/hooks/dispatch.mjs"), "utf-8"), /(?:expert|plugin)/);

    const reminderOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "UserPromptSubmit"],
      {
        cwd: repoRoot,
        input: JSON.stringify({ prompt: "请检查 dist/claude 的 hooks" }),
        encoding: "utf-8",
      },
    );
    assert.match(reminderOutput, /additionalContext/);
    assert.match(reminderOutput, /src\/components/);

    const ignoredSecretPathOnBashOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "Bash",
          tool_input: { command: "echo ok", file_path: ".env" },
        }),
        encoding: "utf-8",
      },
    );
    assert.equal(
      ignoredSecretPathOnBashOutput.trim(),
      "",
      "Bash matcher should not run Edit/Write secret path hooks",
    );

    const secretWriteOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "Write",
          tool_input: { file_path: ".env", content: "API_KEY=test" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(secretWriteOutput, /"decision": "block"/);
    assert.match(secretWriteOutput, /Secret Write Guard/);

    const dangerousCommandOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Bash",
          toolInput: { command: "rm -rf /" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(dangerousCommandOutput, /"decision": "block"/);
    assert.match(dangerousCommandOutput, /Dangerous Command/);

    const guardOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PostToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: { command: "*** Update File: dist/claude/CLAUDE.md\n" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(guardOutput, /additionalContext/);
    assert.match(guardOutput, /Generated dist output/);
  });

  test("renders generated skill markdown sections and excludes eval references", () => {
    for (const platform of ["claude", "codex"]) {
      const generatedEvalsReferences = collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
        file.includes(join("references", "evals")),
      );
      assert.equal(
        generatedEvalsReferences.length,
        0,
        `${platform} output should not copy evals under references`,
      );

      for (const skillFile of collectFiles(join(tmpDistDir, platform, "skills"), (file) => file.endsWith("SKILL.md"))) {
        const source = stripFrontmatter(readFileSync(skillFile, "utf-8")).trimStart();
        assert.match(source, /^#\s+\S/, `${skillFile} should render an H1 heading from fullName`);
        assert.match(
          source,
          /^#\s+.+\r?\n\r?\n## 适用场景\r?\n[\s\S]*?\r?\n## 核心约束\r?\n/m,
          `${skillFile} should render useCases and constraints immediately after the H1 heading`,
        );
        assert.equal(countH2OutsideCodeFence(source, "适用场景"), 1, `${skillFile} should render exactly one useCases section`);
        assert.equal(countH2OutsideCodeFence(source, "核心约束"), 1, `${skillFile} should render exactly one constraints section`);

        if (source.includes("## 相关 Skill")) {
          assert.match(
            source,
            /^## 相关 Skill\r?\n\r?\n- \[[^\]]+\]\(\.\.\/[^)]+\/SKILL\.md\) — \S/m,
            `${skillFile} should render relatedSkills as generated skill links`,
          );
        }

        if (countH2OutsideCodeFence(source, "检查清单") > 0) {
          assert.match(source, /^## 检查清单\r?\n\r?\n- \[ \] \S/m, `${skillFile} should render checklist as generated checkbox items`);
          assert.equal(countH2OutsideCodeFence(source, "检查清单"), 1, `${skillFile} should render exactly one checklist section`);
        }

        if (countH2OutsideCodeFence(source, "反模式") > 0) {
          assert.match(
            source,
            /^## 反模式\r?\n\r?\n\| 反模式 \| 正确做法 \|\r?\n\|--------\|----------\|\r?\n\| .+ \| .+ \|/m,
            `${skillFile} should render antiPatterns as a generated markdown table`,
          );
          assert.equal(countH2OutsideCodeFence(source, "反模式"), 1, `${skillFile} should render exactly one anti-pattern section`);
        }
      }
    }
  });
});
