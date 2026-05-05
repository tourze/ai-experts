import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const repoRoot = resolve(".");

function collectFiles(root, predicate = () => true) {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && predicate(full)) files.push(full);
    }
  }
  walk(root);
  return files.sort();
}

function hasTopLevelHeadingOutsideCodeFence(source) {
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && /^#\s+\S/.test(line)) {
      return true;
    }
  }
  return false;
}

function countH2OutsideCodeFence(source, title) {
  let count = 0;
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && line.trim() === `## ${title}`) {
      count += 1;
    }
  }
  return count;
}

function countH2OutsideCodeFenceMatching(source, predicate) {
  let count = 0;
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence) {
      const heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading && predicate(heading[1].trim())) count += 1;
    }
  }
  return count;
}

function stripFrontmatter(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "");
}

function extractRelativeRuntimeSpecifiers(source) {
  const specifiers = [];
  for (const match of source.matchAll(/^\s*(?:import|export|})[^\n]*\bfrom\s+["'](\.[^"']+)["']/gm)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(/^\s*import\s+["'](\.[^"']+)["']/gm)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(/\bimport\(\s*["'](\.[^"']+)["']\s*\)/g)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function firstNonEmptyLine(source) {
  return source.trimStart().split(/\r?\n/, 1)[0] ?? "";
}

function extractPropertyArray(source, property) {
  const propertyMatch = new RegExp(`\\b${property}\\s*:`).exec(source);
  if (!propertyMatch) return null;
  const open = source.indexOf("[", propertyMatch.index + propertyMatch[0].length);
  if (open === -1) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error(`Unclosed ${property} array`);
}

function assertSingleDispatcherHookGroups(config, label) {
  for (const [event, groups] of Object.entries(config.hooks)) {
    const seenMatchers = new Set();
    for (const group of groups) {
      const matcher = group.matcher ?? "";
      const key = `${event}\0${matcher}`;
      assert.equal(seenMatchers.has(key), false, `${label} should emit one group per ${event}/${matcher}`);
      seenMatchers.add(key);
      assert.equal(
        group.hooks.length,
        1,
        `${label} ${event}/${matcher || "(no matcher)"} should invoke the single bundled dispatcher once`,
      );
      assert.match(group.hooks[0].command, /hooks\/dispatch\.mjs/);
    }
  }
}

test("component build emits claude and codex component surfaces", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-component-build-"));
  try {
    execFileSync(
      process.execPath,
      ["scripts/build-components.mjs", "--out-dir", tmp],
      { cwd: repoRoot, encoding: "utf-8" },
    );

    const claudeManifest = JSON.parse(readFileSync(join(tmp, "claude/manifest.json"), "utf-8"));
    const codexManifest = JSON.parse(readFileSync(join(tmp, "codex/manifest.json"), "utf-8"));
    assert.equal(claudeManifest.skills.length, 338);
    assert.equal(codexManifest.skills.length, 338);
    assert.equal(claudeManifest.agents.length, 80);
    assert.equal(codexManifest.agents.length, 80);
    assert.equal(claudeManifest.hooks.length, 99);
    assert.equal(codexManifest.hooks.length, 99);

    const tsSkill = readFileSync(
      join(tmp, "claude/skills/typescript-type-safety/SKILL.md"),
      "utf-8",
    );
    assert.match(tsSkill, /name: typescript-type-safety/);
    assert.match(tsSkill, /Reference Map/);
    assert.doesNotMatch(tsSkill, /plugins\//);
    assert.equal(
      existsSync(join(tmp, "claude/skills/typescript-type-safety/references/advanced-patterns.md")),
      true,
    );

    const screenshotSkill = readFileSync(join(tmp, "codex/skills/screenshot/SKILL.md"), "utf-8");
    assert.match(screenshotSkill, /Script Registry/);
    assert.match(screenshotSkill, /take-screenshot/);
    assert.equal(
      existsSync(join(tmp, "codex/skills/screenshot/scripts/take_screenshot.mjs")),
      true,
    );
    assert.equal(
      existsSync(join(tmp, "codex/skills/screenshot/assets/screenshot.png")),
      true,
    );
    const sourceMjsSkillScripts = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs")
    );
    assert.deepEqual(sourceMjsSkillScripts, [], "skill script source files should use TypeScript");
    const generatedTsSkillScripts = collectFiles(join(tmp, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".ts")
    );
    assert.deepEqual(generatedTsSkillScripts, [], "generated skill scripts should not copy TypeScript source files");
    const generatedMjsScriptsWithExtensionlessImports = collectFiles(join(tmp, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs")
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return extractRelativeRuntimeSpecifiers(source).some((specifier) => {
        const leaf = specifier.split("/").at(-1) ?? "";
        return extname(leaf) === "";
      });
    });
    assert.deepEqual(
      generatedMjsScriptsWithExtensionlessImports,
      [],
      "generated .mjs scripts should keep Node-resolvable relative import extensions",
    );
    const generatedMjsScriptsWithMissingRelativeImports = collectFiles(join(tmp, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs")
    ).flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return extractRelativeRuntimeSpecifiers(source)
        .map((specifier) => join(dirname(file), specifier))
        .filter((target) => !existsSync(target));
    });
    assert.deepEqual(
      generatedMjsScriptsWithMissingRelativeImports,
      [],
      "generated .mjs scripts should only import files that exist in dist",
    );
    const generatedMjsScriptsWithDuplicateShebangs = collectFiles(join(tmp, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs")
    ).filter((file) => {
      const shebangLines = readFileSync(file, "utf-8")
        .split(/\r?\n/)
        .filter((line) => line.startsWith("#!"));
      return shebangLines.length > 1;
    });
    assert.deepEqual(
      generatedMjsScriptsWithDuplicateShebangs,
      [],
      "generated .mjs scripts should not contain duplicate shebangs",
    );

    const goTestingPatternsSkill = readFileSync(
      join(tmp, "claude/skills/go-testing-patterns/SKILL.md"),
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
      join(tmp, "codex/skills/typescript-type-safety/agents/openai.yaml"),
      "utf-8",
    );
    assert.match(codexMetadata, /allow_implicit_invocation: true/);

    const scriptManifest = JSON.parse(readFileSync(
      join(tmp, "claude/skills/screenshot/scripts/manifest.json"),
      "utf-8",
    ));
    assert.equal(
      scriptManifest.scripts.some((script) => script.id === "take-screenshot" && script.runtime === "node"),
      true,
    );

    const claudeAgent = readFileSync(join(tmp, "claude/agents/typescript-reviewer.md"), "utf-8");
    assert.match(claudeAgent, /name: typescript-reviewer/);
    assert.match(claudeAgent, /skills:\n  - typescript-type-safety\n  - debug-methodology/);
    assert.match(claudeAgent, /model: sonnet\neffort: high/);
    assert.match(claudeAgent, /你是资深 TypeScript 工程师/);
    assert.match(claudeAgent, /`debug-methodology` \(route\)/);

    const typescriptEngineerAgent = readFileSync(
      join(tmp, "claude/agents/typescript-engineer.md"),
      "utf-8",
    );
    assert.match(typescriptEngineerAgent, /## Bash 使用边界/);
    assert.match(typescriptEngineerAgent, /## 工作流/);
    assert.match(typescriptEngineerAgent, /```mermaid\nflowchart TD/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 工作流") <
        typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent workflow should stay before quality standards",
    );
    assert.ok(
      typescriptEngineerAgent.indexOf("## Bash 使用边界") <
        typescriptEngineerAgent.indexOf("## 输出格式"),
      "generated agent Bash boundary should stay near the operational guidance sections",
    );
    assert.match(typescriptEngineerAgent, /# TypeScript 工程报告：<scope>/);
    assert.match(typescriptEngineerAgent, /## 质量标准/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 输出格式") <
        typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent quality standards should stay after agent-specific output guidance",
    );

    const productDiscovererAgent = readFileSync(
      join(tmp, "claude/agents/product-discoverer.md"),
      "utf-8",
    );
    assert.doesNotMatch(
      productDiscovererAgent,
      /## Bash 使用边界/,
      "agents without KnownTool.Bash should not emit Bash boundary instructions",
    );
    const analyzerAgent = readFileSync(join(tmp, "claude/agents/analyzer.md"), "utf-8");
    assert.doesNotMatch(
      analyzerAgent,
      /## 质量标准/,
      "agents without qualityStandards should not emit quality standards",
    );
    assert.doesNotMatch(
      claudeAgent,
      /## 输出格式/,
      "agents without outputFormat should not emit output format instructions",
    );
    assert.doesNotMatch(
      analyzerAgent,
      /Analyzing Benchmark Results/,
      "analyzer should keep a single output format and one responsibility",
    );
    const goReviewerAgent = readFileSync(join(tmp, "claude/agents/go-reviewer.md"), "utf-8");
    assert.match(goReviewerAgent, /## 工作流/);
    assert.match(goReviewerAgent, /```mermaid\nflowchart TD/);
    assert.match(goReviewerAgent, /匹配场景路由/);
    assert.match(goReviewerAgent, /go-concurrency-patterns/);

    const codexAgent = readFileSync(join(tmp, "codex/agents/frontend-engineer.toml"), "utf-8");
    assert.match(codexAgent, /name = "frontend-engineer"/);
    assert.doesNotMatch(codexAgent, /model = "sonnet"/);
    assert.match(codexAgent, /sandbox_mode = "workspace-write"/);
    assert.match(codexAgent, /你是资深 Web 前端工程师/);
    assert.match(codexAgent, /## 技能编排/);
    assert.match(codexAgent, /\[\[skills\.config\]\]\npath = "~\/\.agents\/skills\/modern-web-design\/SKILL\.md"\nenabled = true/);
    assert.match(codexAgent, /## Bash 使用边界/);
    assert.match(codexAgent, /# 前端工程报告：<scope>/);
    assert.match(codexAgent, /## 质量标准/);
    assert.match(codexAgent, /developer_instructions = '''\n/);
    const codexWebmanAgent = readFileSync(join(tmp, "codex/agents/webman-reviewer.toml"), "utf-8");
    assert.match(codexWebmanAgent, /developer_instructions = '''\n/);
    assert.match(codexWebmanAgent, /Illuminate\\Database/);

    const claudeInstructions = readFileSync(join(tmp, "claude/CLAUDE.md"), "utf-8");
    assert.match(claudeInstructions, /Runtime Model/);
    assert.match(claudeInstructions, /frontend-engineer/);
    assert.match(claudeInstructions, /component-routing-reminder/);

    const codexInstructions = readFileSync(join(tmp, "codex/AGENTS.md"), "utf-8");
    assert.match(codexInstructions, /Source of truth: src\/components\//);

    const claudeSettings = JSON.parse(readFileSync(join(tmp, "claude/settings.json"), "utf-8"));
    const codexHooksConfig = JSON.parse(readFileSync(join(tmp, "codex/hooks.json"), "utf-8"));
    assert.equal(claudeSettings.hooks.UserPromptSubmit[0].hooks[0].type, "command");
    assert.match(claudeSettings.hooks.PostToolUse[0].matcher, /apply_patch/);
    assertSingleDispatcherHookGroups(claudeSettings, "claude settings");
    assertSingleDispatcherHookGroups(codexHooksConfig, "codex hooks");
    assert.equal(claudeSettings.hooks.PostToolUse[0].hooks.length, 1);
    assert.equal(codexHooksConfig.hooks.PostToolUse[0].hooks.length, 1);

    const codexConfig = readFileSync(join(tmp, "codex/config.toml"), "utf-8");
    assert.match(codexConfig, /codex_hooks = true/);

    const hookManifest = JSON.parse(readFileSync(join(tmp, "codex/hooks/manifest.json"), "utf-8"));
    assert.equal(hookManifest.hooks.some((hook) => hook.id === "component-routing-reminder"), true);
    assert.equal(hookManifest.hooks.some((hook) => hook.id === "dangerous-command-guard"), true);
    assert.equal(existsSync(join(tmp, "claude/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmp, "codex/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmp, "claude/hooks/modules")), false);
    assert.equal(existsSync(join(tmp, "codex/hooks/modules")), false);
    assert.equal(hookManifest.hooks.some((hook) => "module" in hook), false);
    assert.equal(hookManifest.hooks.some((hook) => /(?:expert|plugin)/.test(hook.id)), false);
    assert.doesNotMatch(readFileSync(join(tmp, "claude/hooks/dispatch.mjs"), "utf-8"), /(?:expert|plugin)/);
    assert.doesNotMatch(readFileSync(join(tmp, "codex/hooks/dispatch.mjs"), "utf-8"), /(?:expert|plugin)/);

    const reminderOutput = execFileSync(
      process.execPath,
      [join(tmp, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "UserPromptSubmit"],
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
      [join(tmp, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "PreToolUse"],
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
      [join(tmp, "claude/hooks/dispatch.mjs"), "--platform", "claude-code", "--event", "PreToolUse"],
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
      [join(tmp, "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PreToolUse"],
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
      [join(tmp, "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PostToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: { command: "*** Update File: dist/claude/CLAUDE.md\n" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(guardOutput, /"decision": "block"/);
    assert.match(guardOutput, /Generated dist output/);

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
      "registry.generated.ts should not manually import hooks; build-components discovers hooks from src/components/hooks",
    );
    const removedLayer = ["migr", "ated"].join("");
    assert.equal(existsSync(join(repoRoot, "src/components", removedLayer)), false);

    for (const agentBodyFile of collectFiles(join(repoRoot, "src/components/agents"), (file) => file.endsWith("AGENT.body.md"))) {
      const source = readFileSync(agentBodyFile, "utf-8");
      assert.notEqual(source.trim(), "", `${agentBodyFile} should be deleted instead of kept as an empty body placeholder`);
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
    for (const agentSourceFile of collectFiles(join(repoRoot, "src/components/agents"), (file) => file.endsWith("index.ts"))) {
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
          bashBoundarySource,
          /["`][\s\S]*\S[\s\S]*["`]/,
          `${agentSourceFile} should define bashBoundary as a non-empty string array`,
        );
      }
      if (hasQualityStandards) {
        agentQualityStandardsCount += 1;
        const qualityStandardsSource = extractPropertyArray(source, "qualityStandards");
        assert.notEqual(qualityStandardsSource, null, `${agentSourceFile} should define qualityStandards as an array`);
        assert.match(
          qualityStandardsSource,
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
            sectionsSource,
            /defineAgentOutputSection\(\{/,
            `${agentSourceFile} should define each output section through defineAgentOutputSection`,
          );
          assert.doesNotMatch(
            sectionsSource,
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

    const allowedHookRoots = new Set([
      "_shared",
      "post-tool-use",
      "pre-compact",
      "pre-tool-use",
      "session-start",
      "stop",
      "user-prompt-submit",
      "index.ts",
    ]);
    for (const hookSourceFile of collectFiles(join(repoRoot, "src/components/hooks"))) {
      const relativeHookPath = hookSourceFile.slice(join(repoRoot, "src/components/hooks").length + 1);
      assert.equal(
        allowedHookRoots.has(relativeHookPath.split(/[\\/]/)[0]),
        true,
        `${hookSourceFile} should live directly under lifecycle hook directories`,
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

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts"))) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /from\s+["']\.[^"']+\.js["']|import\s+["']\.[^"']+\.js["']|import\(\s*["']\.[^"']+\.js["']\s*\)/,
        `${sourceFile} should use extensionless relative imports`,
      );
    }

    for (const bodyFile of collectFiles(join(repoRoot, "src/components/skills"), (file) => file.endsWith("SKILL.body.md"))) {
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

    for (const platform of ["claude", "codex"]) {
      const generatedEvalsReferences = collectFiles(join(tmp, platform, "skills"), (file) =>
        file.includes(join("references", "evals"))
      );
      assert.equal(
        generatedEvalsReferences.length,
        0,
        `${platform} output should not copy evals under references`,
      );
      for (const skillFile of collectFiles(join(tmp, platform, "skills"), (file) => file.endsWith("SKILL.md"))) {
        const source = stripFrontmatter(readFileSync(skillFile, "utf-8")).trimStart();
        assert.match(source, /^#\s+\S/, `${skillFile} should render an H1 heading from fullName`);
        assert.match(
          source,
          /^#\s+.+\r?\n\r?\n## 适用场景\r?\n[\s\S]*?\r?\n## 核心约束\r?\n/m,
          `${skillFile} should render useCases and constraints immediately after the H1 heading`,
        );
        assert.equal(
          countH2OutsideCodeFence(source, "适用场景"),
          1,
          `${skillFile} should render exactly one useCases section`,
        );
        assert.equal(
          countH2OutsideCodeFence(source, "核心约束"),
          1,
          `${skillFile} should render exactly one constraints section`,
        );
        if (source.includes("## 相关 Skill")) {
          assert.match(
            source,
            /^## 相关 Skill\r?\n\r?\n- \[[^\]]+\]\(\.\.\/[^)]+\/SKILL\.md\) — \S/m,
            `${skillFile} should render relatedSkills as generated skill links`,
          );
        }
        if (countH2OutsideCodeFence(source, "检查清单") > 0) {
          assert.match(
            source,
            /^## 检查清单\r?\n\r?\n- \[ \] \S/m,
            `${skillFile} should render checklist as generated checkbox items`,
          );
          assert.equal(
            countH2OutsideCodeFence(source, "检查清单"),
            1,
            `${skillFile} should render exactly one checklist section`,
          );
        }
        if (countH2OutsideCodeFence(source, "反模式") > 0) {
          assert.match(
            source,
            /^## 反模式\r?\n\r?\n\| 反模式 \| 正确做法 \|\r?\n\|--------\|----------\|\r?\n\| .+ \| .+ \|/m,
            `${skillFile} should render antiPatterns as a generated markdown table`,
          );
          assert.equal(
            countH2OutsideCodeFence(source, "反模式"),
            1,
            `${skillFile} should render exactly one anti-pattern section`,
          );
        }
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("hook telemetry records stable component names and reminder cooldown", async () => {
  const telemetryDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-telemetry-"));
  const workspaceDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-workspace-"));
  const previousTelemetryDir = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
  const previousTelemetryWorkspace = process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;

  process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = telemetryDir;
  process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = workspaceDir;

  try {
    const cacheKey = `?test=${Date.now()}`;
    const auditTelemetry = await import(
      `${pathToFileURL(join(repoRoot, "src/components/hooks/_shared/audit-telemetry.mjs")).href}${cacheKey}`
    );
    const reminder = await import(
      `${pathToFileURL(join(
        repoRoot,
        "src/components/hooks/user-prompt-submit/skill-trigger-telemetry-advisor-reminder.ts",
      )).href}${cacheKey}`
    );
    const payload = {
      cwd: workspaceDir,
      session_id: "test-session",
      transcript_path: null,
      prompt: "请继续审计这些 hook 并修复所有发现的问题",
    };

    for (let index = 0; index < 3; index += 1) {
      auditTelemetry.recordAuditTelemetry(payload, {
        hook: "skill-usage-audit.mjs",
        event: "stop",
        decision: "audit",
        audit_type: "skill_usage",
        missing_route: true,
        routed_but_not_used: false,
        skills_recommended: [],
        skills_used: [],
      });
    }

    const first = await reminder.run(payload);
    assert.equal(first?.decision, "context");
    assert.match(first.reason, /Trigger Telemetry Advisor Reminder/);

    const second = await reminder.run(payload);
    assert.equal(second, null);

    const entries = auditTelemetry.readRecentTelemetryEntries(payload);
    const reminderEntry = entries.find((entry) =>
      entry.audit_type === "trigger_telemetry_advisor_reminder");
    assert.equal(reminderEntry.component, "hooks");
    assert.equal(entries.some((entry) => Object.hasOwn(entry, "plugin")), false);
  } finally {
    if (previousTelemetryDir === undefined) delete process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
    else process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = previousTelemetryDir;
    if (previousTelemetryWorkspace === undefined) delete process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;
    else process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = previousTelemetryWorkspace;
    rmSync(telemetryDir, { recursive: true, force: true });
    rmSync(workspaceDir, { recursive: true, force: true });
  }
});
