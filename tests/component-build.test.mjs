import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
    assert.equal(
      existsSync(join(tmp, "claude/skills/typescript-type-safety/references/evals/cases.yaml")),
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
    assert.match(claudeAgent, /skills:\n  - typescript-type-safety/);
    assert.match(claudeAgent, /`debug-methodology` \(route\)/);

    const codexAgent = readFileSync(join(tmp, "codex/agents/frontend-engineer.toml"), "utf-8");
    assert.match(codexAgent, /name = "frontend-engineer"/);
    assert.match(codexAgent, /sandbox_mode = "workspace-write"/);
    assert.match(codexAgent, /Skill orchestration:/);

    const claudeInstructions = readFileSync(join(tmp, "claude/CLAUDE.md"), "utf-8");
    assert.match(claudeInstructions, /Runtime Model/);
    assert.match(claudeInstructions, /frontend-engineer/);
    assert.match(claudeInstructions, /component-routing-reminder/);

    const codexInstructions = readFileSync(join(tmp, "codex/AGENTS.md"), "utf-8");
    assert.match(codexInstructions, /Source of truth: src\/components\//);

    const claudeSettings = JSON.parse(readFileSync(join(tmp, "claude/settings.json"), "utf-8"));
    assert.equal(claudeSettings.hooks.UserPromptSubmit[0].hooks[0].type, "command");
    assert.match(claudeSettings.hooks.PostToolUse[0].matcher, /apply_patch/);

    const codexConfig = readFileSync(join(tmp, "codex/config.toml"), "utf-8");
    assert.match(codexConfig, /codex_hooks = true/);

    const hookManifest = JSON.parse(readFileSync(join(tmp, "codex/hooks/manifest.json"), "utf-8"));
    assert.equal(hookManifest.hooks.some((hook) => hook.id === "component-routing-reminder"), true);
    assert.equal(hookManifest.hooks.some((hook) => hook.id === "coding-expert-pre-tool-use-bash-dangerous-command-guard"), true);

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
    const removedLayer = ["migr", "ated"].join("");
    assert.equal(existsSync(join(repoRoot, "src/components", removedLayer)), false);

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts"))) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /from\s+["']\.[^"']+\.js["']|import\s+["']\.[^"']+\.js["']|import\(\s*["']\.[^"']+\.js["']\s*\)/,
        `${sourceFile} should use extensionless relative imports`,
      );
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
