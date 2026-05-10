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

export function registerComponentBuildScriptHookTests(): void {
  test("generates clean script artifacts with valid runtime imports", () => {
    for (const platform of ["claude", "codex"]) {
      assert.equal(existsSync(join(getTmpDistDir(), platform, "scripts")), false);
      assert.deepEqual(
        collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
          file.slice(join(getTmpDistDir(), platform, "skills").length + 1).split(/[\\/]/).includes("tests"),
        ),
        [],
        `${platform} skill dist should not include source-side tests/ directories`,
      );
      const staleSkillLocalScriptMentions: string[] = [];
      for (const markdownFile of collectFiles(join(getTmpDistDir(), platform, "skills"), (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (
          /`scripts\/` 下 \d+ 个 CLI/u.test(markdown) ||
          /仅把 `scripts\/` 目录下的可执行 Node 脚本当作入口/u.test(markdown) ||
          /命令中的 `scripts\/\.\.\.` 路径相对本 skill 根目录解析/u.test(markdown) ||
          /└── scripts\/\s+— Utility scripts/u.test(markdown)
        ) {
          staleSkillLocalScriptMentions.push(markdownFile);
        }
      }
      assert.deepEqual(
        staleSkillLocalScriptMentions,
        [],
        `${platform} generated skill docs should not describe removed skill-local script directories`,
      );
      const crossPlatformSkillInvocationHints: string[] = [];
      for (const markdownFile of collectFiles(join(getTmpDistDir(), platform, "skills"), (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (/Claude Code: `\/[A-Za-z0-9_-]+`；Codex: `\$[A-Za-z0-9_-]+`/u.test(markdown)) {
          crossPlatformSkillInvocationHints.push(markdownFile);
        }
      }
      assert.deepEqual(
        crossPlatformSkillInvocationHints,
        [],
        `${platform} generated skill docs should not include dual-platform invocation syntax`,
      );
      assert.equal(
        collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
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

    const sourceAlternateSkillFiles = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      /[\\/]SKILL\.toon$/.test(file),
    );
    assert.deepEqual(sourceAlternateSkillFiles, [], "source skills should not keep alternate SKILL.toon artifacts");

    const sourceCrossPlatformInvocationHints = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("index.ts") &&
      /Claude Code: `\/[A-Za-z0-9_-]+`；Codex: `\$[A-Za-z0-9_-]+`/u.test(readFileSync(file, "utf-8")),
    );
    assert.deepEqual(
      sourceCrossPlatformInvocationHints,
      [],
      "source skills should avoid hard-coded dual-platform invocation syntax",
    );

    const procedureUseIdReferences = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("index.ts") &&
      /procedureUse\([A-Za-z_][A-Za-z0-9_]*\.id\b/.test(readFileSync(file, "utf-8")),
    );
    assert.deepEqual(
      procedureUseIdReferences,
      [],
      "skills should call procedureUse(exportedProcedure) so TypeScript can infer args/results",
    );

    const generatedTsSkillScripts = collectFiles(join(getTmpDistDir(), "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".ts"),
    );
    assert.deepEqual(generatedTsSkillScripts, [], "generated skill scripts should not copy TypeScript source files");

    for (const platform of ["claude", "codex"]) {
      const generatedAlternateSkillFiles = collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
        /[\\/]SKILL\.toon$/.test(file),
      );
      assert.deepEqual(
        generatedAlternateSkillFiles,
        [],
        `${platform} skill dist should not include alternate SKILL.toon artifacts`,
      );

      const generatedPlatformMemoryFiles = collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
        /[\\/](?:AGENTS|CLAUDE)\.md$/.test(file),
      );
      assert.deepEqual(
        generatedPlatformMemoryFiles,
        [],
        `${platform} skill dist should not include platform memory files inside skill packages`,
      );

      const generatedRootMetadataFiles = collectFiles(join(getTmpDistDir(), platform, "skills"), (file) => {
        const parts = file.slice(join(getTmpDistDir(), platform, "skills").length + 1).split(/[\\/]/);
        return parts.length === 2 && /^(?:_meta|metadata)\.json$/.test(parts[1] ?? "");
      });
      assert.deepEqual(
        generatedRootMetadataFiles,
        [],
        `${platform} skill dist should not include root provenance metadata files inside skill packages`,
      );
    }

    const legacySkillScriptRunners = collectFiles(join(getTmpDistDir(), "claude/skills"), (file) =>
      /[\\/]scripts[\\/]run\.mjs$/.test(file),
    );
    const legacySkillScriptManifests = collectFiles(join(getTmpDistDir(), "claude/skills"), (file) =>
      /[\\/]scripts[\\/]manifest\.json$/.test(file),
    );
    assert.deepEqual(legacySkillScriptRunners, [], "legacy per-skill scripts/run.mjs should not be generated");
    assert.deepEqual(legacySkillScriptManifests, [], "legacy per-skill scripts/manifest.json should not be generated");

    for (const platform of ["claude", "codex"]) {
      const legacyRuntimeScriptCommands: string[] = [];
      const leakedRuntimePlaceholders: string[] = [];
      const unquotedProcedurePlaceholders: string[] = [];
      const skillsRoot = join(getTmpDistDir(), platform, "skills");
      for (const markdownFile of collectFiles(skillsRoot, (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        for (const match of markdown.matchAll(/\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/gu)) {
          legacyRuntimeScriptCommands.push(`${markdownFile}: ${match[0]}`);
        }
        for (const match of markdown.matchAll(/<(?:runtime-root|skills-dir)>/gu)) {
          leakedRuntimePlaceholders.push(`${markdownFile}: ${match[0]}`);
        }
        const lines = markdown.split(/\r?\n/u);
        for (let index = 0; index < lines.length; index += 1) {
          const line = lines[index];
          if (!line.includes("procedures.js")) continue;
          for (const match of line.matchAll(/(?<!['"])<[^>\n]+>(?!['"])/gu)) {
            unquotedProcedurePlaceholders.push(`${markdownFile}:${index + 1}: ${match[0]}`);
          }
        }
      }
      assert.deepEqual(
        legacyRuntimeScriptCommands,
        [],
        `${platform} Markdown should not reference legacy local scripts`,
      );
      assert.deepEqual(
        leakedRuntimePlaceholders,
        [],
        `${platform} Markdown should rewrite generated runtime path placeholders`,
      );
      assert.deepEqual(
        unquotedProcedurePlaceholders,
        [],
        `${platform} Markdown procedure commands should quote angle-bracket placeholders`,
      );

      const sourceProcedureEntrypointReferences: string[] = [];
      const pseudoProcedureCommands: string[] = [];
      for (const markdownFile of collectFiles(skillsRoot, (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (/src\/components\/procedures\/sources/.test(markdown)) {
          sourceProcedureEntrypointReferences.push(markdownFile);
        }
        if (
          markdownFile.split(/[\\/]/).includes("references") &&
          /\bprocedure\s+`[a-z0-9-]+`/.test(markdown)
        ) {
          pseudoProcedureCommands.push(markdownFile);
        }
      }
      assert.deepEqual(
        sourceProcedureEntrypointReferences,
        [],
        `${platform} Markdown should not reference source-side procedure entrypoints`,
      );
      assert.deepEqual(
        pseudoProcedureCommands,
        [],
        `${platform} reference docs should point to generated procedure commands instead of pseudo procedure syntax`,
      );

      const staleAgentScriptCommands: string[] = [];
      const agentsRoot = join(getTmpDistDir(), platform, "agents");
      for (const agentFile of collectFiles(agentsRoot, (file) => /\.(?:md|toml)$/.test(file))) {
        const agentText = readFileSync(agentFile, "utf-8");
        for (const match of agentText.matchAll(/\b(?:node\s+)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/gu)) {
          const prefix = agentText.slice(Math.max(0, (match.index ?? 0) - ".specify/".length), match.index);
          if (prefix === ".specify/") continue;
          staleAgentScriptCommands.push(`${agentFile}: ${match[0]}`);
        }
      }
      assert.deepEqual(
        staleAgentScriptCommands,
        [],
        `${platform} agents should reference procedures or skills instead of legacy repository scripts`,
      );
    }

    for (const platform of ["claude", "codex"]) {
      const platformProceduresSource = readFileSync(join(getTmpDistDir(), `${platform}/procedures.js`), "utf-8");
      assert.doesNotMatch(
        platformProceduresSource,
        /\bnode\s+(?:\.\/)?scripts\//,
        `${platform} bundled procedures.js should not suggest removed repository-local scripts`,
      );
      assert.doesNotMatch(
        platformProceduresSource,
        /\.\/src\/components\/|src\/components\/procedures\/sources/,
        `${platform} bundled procedures.js should not expose source-tree procedure module ids`,
      );
      assert.doesNotMatch(
        platformProceduresSource,
        /\b(?:ComponentKind|InvocationPolicy|KnownTool|HookEvent|defineSkill|defineAgent|defineHook)\b/,
        `${platform} bundled procedures.js should not include unrelated skill/agent/hook SDK helpers`,
      );
      assert.doesNotMatch(
        platformProceduresSource,
        /\b(?:defineCliProcedure|procedureEntry|runtimeProcedureOutput|defineProcedureOutput)\b|entry:\s*new URL\("ai-experts-procedure:/,
        `${platform} bundled procedures.js should not include source-side procedure registration metadata`,
      );
      assert.match(platformProceduresSource, /ai-experts-component-module:procedures\/sources/);
      if (platform === "claude") {
        assert.match(
          platformProceduresSource,
          /skills\/skill-creator\/assets\/eval-viewer\/viewer\.html/,
          "Claude bundled procedures.js should load the registered skill-creator viewer asset",
        );
      } else {
        assert.doesNotMatch(
          platformProceduresSource,
          /skills\/skill-creator\/assets\/eval-viewer\/viewer\.html/,
          "Codex bundled procedures.js should not load custom skill-creator assets",
        );
      }
      assert.doesNotMatch(
        platformProceduresSource,
        /skills\/skill-creator\/eval-viewer\/viewer\.html/,
        `${platform} bundled procedures.js should not load stale loose skill-creator viewer paths`,
      );
    }

    const proceduresSource = readFileSync(join(getTmpDistDir(), "claude/procedures.js"), "utf-8");
    const codexProceduresSource = readFileSync(join(getTmpDistDir(), "codex/procedures.js"), "utf-8");
    const procedureRegistrySource = readFileSync(join(repoRoot, "src/components/procedures/registry.ts"), "utf-8");
    assert.doesNotMatch(procedureRegistrySource, /bundle:\s*false/);
    assert.match(proceduresSource, /^#!\/usr\/bin\/env node/);
    assert.match(proceduresSource, /__webpack_modules__/);
    assert.match(proceduresSource, /\bnode ~\/\.claude\/procedures\.js --procedure-id md-to-pdf-setup --trigger-skill md-to-pdf -- --install\b/);
    assert.match(
      proceduresSource,
      /Run this first: node ~\/\.claude\/procedures\.js --procedure-id remote-ssh-command-install-sshpass --trigger-skill remote-ssh-command\./,
    );
    assert.match(codexProceduresSource, /\bnode ~\/\.codex\/procedures\.js --procedure-id screenshot-take-screenshot --trigger-skill screenshot --/);
    assert.match(
      codexProceduresSource,
      /Run this first: node ~\/\.codex\/procedures\.js --procedure-id remote-ssh-command-install-sshpass --trigger-skill remote-ssh-command\./,
    );
    assert.deepEqual(
      [
        ...findRuntimeCommandsMissingPassthroughSeparator(proceduresSource, "claude/procedures.js"),
        ...findRuntimeCommandsMissingPassthroughSeparator(codexProceduresSource, "codex/procedures.js"),
      ],
      [],
      "bundled procedure help should include -- before procedure arguments so runtime flags cannot consume them",
    );
    assert.doesNotMatch(proceduresSource, /\bnode \S*procedures\.js --procedure-id [a-z0-9-]+ -- --/);
    assert.doesNotMatch(codexProceduresSource, /\bnode \S*procedures\.js --procedure-id [a-z0-9-]+ -- --/);
    assert.match(codexProceduresSource, /const platform = "codex-cli"/);
    assert.match(
      codexProceduresSource,
      /homedir\)\(\),\s*"\.agents",\s*"skills",\s*skillId/,
      "codex bundled procedures should resolve skill owner roots from ~/.agents/skills",
    );
    assert.doesNotMatch(codexProceduresSource, /spawn\)\("claude"|spawn\("claude"/);
    assert.doesNotMatch(codexProceduresSource, /\.claude["']\s*,\s*["']skills|\.claude\/skills/);
    assert.doesNotMatch(codexProceduresSource, /\.codex["']\s*,\s*["']skills|\.codex\/skills/);
    assert.doesNotMatch(proceduresSource, /"source"\s*:/, "procedures.js should not embed procedure code as JSON strings");
    assert.doesNotMatch(proceduresSource, /procedure\.source|writeFileSync\(target/);
    assert.doesNotMatch(proceduresSource, /ai-components-|procedure-runtime-entry/);
    assert.doesNotMatch(proceduresSource, /\.globalThis\.__aiExperts/);
    for (const platform of ["claude", "codex"]) {
      const hookDispatchSource = readFileSync(join(getTmpDistDir(), `${platform}/hooks/dispatch.mjs`), "utf-8");
      assert.doesNotMatch(
        hookDispatchSource,
        /\bnode scripts\/(?:trigger-audit-report|skill-quality-report|hook-telemetry-report|audit-skill-evals)\.mjs\b/,
        `${platform} hooks should not suggest removed repository-local scripts`,
      );
      assert.doesNotMatch(
        hookDispatchSource,
        /\.ai-components/,
        `${platform} hooks should use ai-experts runtime state directories`,
      );
    }
    const distLocalImports = proceduresSource
      .split(/\r?\n/)
      .filter((line) => line.startsWith("import "))
      .filter((line) => /from ["']\.\.?\//.test(line));
    assert.deepEqual(
      distLocalImports,
      [],
      "bundled procedures.js should not import dist-local modules",
    );
  });

  test("wires hook dispatchers and runtime guard behaviors", () => {
    const claudeSettings = JSON.parse(readFileSync(join(getTmpDistDir(), "claude/settings.json"), "utf-8"));
    const codexHooksConfig = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/hooks.json"), "utf-8"));
    const claudeHookCommand = claudeSettings.hooks.PostToolUse[0].hooks[0].command as string;
    const codexHookCommand = codexHooksConfig.hooks.PostToolUse[0].hooks[0].command as string;

    assert.equal(claudeSettings.hooks.UserPromptSubmit[0].hooks[0].type, "command");
    assert.match(claudeSettings.hooks.PostToolUse[0].matcher, /apply_patch/);
    assert.match(claudeHookCommand, /\$HOME\/\.claude\/hooks\/dispatch\.mjs/);
    assert.match(codexHookCommand, /\$HOME\/\.codex\/hooks\/dispatch\.mjs/);
    assert.doesNotMatch(claudeHookCommand, /:-/);
    assert.doesNotMatch(codexHookCommand, /:-/);
    assertSingleDispatcherHookGroups(claudeSettings, "claude settings");
    assertSingleDispatcherHookGroups(codexHooksConfig, "codex hooks");
    assert.equal(claudeSettings.hooks.PostToolUse[0].hooks.length, 1);
    assert.equal(codexHooksConfig.hooks.PostToolUse[0].hooks.length, 1);

    const codexConfig = readFileSync(join(getTmpDistDir(), "codex/config.toml"), "utf-8");
    assert.match(codexConfig, /codex_hooks = true/);

    const claudeHookManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "claude/hooks/manifest.json"), "utf-8"));
    const hookManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/hooks/manifest.json"), "utf-8"));
    assertHookGroupTimeoutsMatchManifest(claudeSettings, claudeHookManifest, "claude settings");
    assertHookGroupTimeoutsMatchManifest(codexHooksConfig, hookManifest, "codex hooks");
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "component-routing-reminder"), true);
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "dangerous-command-guard"), true);
    assert.equal(
      hookManifest.hooks.some((hook: any) => hook.event === "PreCompact"),
      false,
      "Codex hooks should only include events supported by the current Codex hooks contract",
    );
    assert.equal(existsSync(join(getTmpDistDir(), "claude/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/hooks/dispatch.mjs")), true);
    assert.notEqual(statSync(join(getTmpDistDir(), "claude/hooks/dispatch.mjs")).mode & 0o111, 0);
    assert.notEqual(statSync(join(getTmpDistDir(), "codex/hooks/dispatch.mjs")).mode & 0o111, 0);
    assert.equal(existsSync(join(getTmpDistDir(), "claude/hooks/modules")), false);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/hooks/modules")), false);
    assert.equal(hookManifest.hooks.some((hook: any) => "module" in hook), false);
    assert.equal(hookManifest.hooks.some((hook: any) => "payloadMode" in hook), false);
    const legacyHookNamingPattern = /(?:^|["/_.-])(?:expert|plugin)(?:["/_.-]|$)/;
    assert.equal(hookManifest.hooks.some((hook: any) => legacyHookNamingPattern.test(hook.id)), false);
    const claudeDispatchSource = readFileSync(join(getTmpDistDir(), "claude/hooks/dispatch.mjs"), "utf-8");
    const codexDispatchSource = readFileSync(join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "utf-8");
    assert.doesNotMatch(claudeDispatchSource, legacyHookNamingPattern);
    assert.doesNotMatch(codexDispatchSource, legacyHookNamingPattern);
    assert.doesNotMatch(claudeDispatchSource, /\bdefineHook\(/);
    assert.doesNotMatch(codexDispatchSource, /\bdefineHook\(/);
    assert.doesNotMatch(claudeDispatchSource, /entry:\s*new URL\(/);
    assert.doesNotMatch(codexDispatchSource, /entry:\s*new URL\(/);

    const reminderOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "claude/hooks/dispatch.mjs"), "--event", "UserPromptSubmit"],
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
      [join(getTmpDistDir(), "claude/hooks/dispatch.mjs"), "--event", "PreToolUse"],
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
      [join(getTmpDistDir(), "claude/hooks/dispatch.mjs"), "--event", "PreToolUse"],
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

    const codexSecretWriteOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Write",
          toolInput: { filePath: ".env", content: "API_KEY=test" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(codexSecretWriteOutput, /"permissionDecision": "deny"/);
    assert.match(codexSecretWriteOutput, /"permissionDecisionReason"/);
    assert.match(codexSecretWriteOutput, /Secret Write Guard/);

    const patchSecretWriteOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: {
            command: [
              "*** Begin Patch",
              "*** Update File: config/example.env",
              "*** Move to: .env",
              "+API_KEY=test",
              "*** End Patch",
            ].join("\n"),
          },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(patchSecretWriteOutput, /"permissionDecision": "deny"/);
    assert.match(patchSecretWriteOutput, /Secret Write Guard/);

    const dangerousCommandOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Bash",
          toolInput: { command: "rm -rf /" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(dangerousCommandOutput, /"permissionDecision": "deny"/);
    assert.match(dangerousCommandOutput, /Dangerous Command/);

    const codexTmpCatWriteOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Bash",
          toolInput: {
            command: "cat > /tmp/codex-hook-test.txt <<'EOF'\nhello\nEOF",
          },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(codexTmpCatWriteOutput, /"systemMessage"/);
    assert.doesNotMatch(codexTmpCatWriteOutput, /additionalContext/);
    assert.match(codexTmpCatWriteOutput, /Cat Write Guard/);

    const guardOutput = execFileSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: { command: "*** Update File: dist/claude/CLAUDE.md\n" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(guardOutput, /"permissionDecision": "deny"/);
    assert.match(guardOutput, /Generated dist output cannot be edited directly/);

    const stalePlatformArgResult = spawnSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: "{}",
        encoding: "utf-8",
      },
    );
    assert.notEqual(stalePlatformArgResult.status, 0);
    assert.match(stalePlatformArgResult.stderr, /Unknown argument: --platform/);

    const shortOptionEventResult = spawnSync(
      process.execPath,
      [join(getTmpDistDir(), "codex/hooks/dispatch.mjs"), "--event", "-h"],
      {
        cwd: repoRoot,
        input: "{}",
        encoding: "utf-8",
      },
    );
    assert.notEqual(shortOptionEventResult.status, 0);
    assert.match(shortOptionEventResult.stderr, /--event requires a value/);
  });

}
