import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildAggregatedHooks } from "../scripts/generate-codex-hooks.mjs";

function flattenHookEntries(config) {
  return Object.values(config.hooks ?? {}).flat();
}

test("generate-codex-hooks 输出中不保留 Claude matcher", () => {
  const aggregated = buildAggregatedHooks(true);
  const entries = flattenHookEntries(aggregated);
  const matchers = entries.map((entry) => entry.matcher);

  assert.ok(matchers.length > 0, "应生成至少一条 hook 规则");
  assert.equal(matchers.includes("Edit|Write"), false, "Codex hooks 不能保留 Edit|Write matcher");
  assert.equal(matchers.includes("Bash"), false, "Codex hooks 不能保留 Bash matcher");
  assert.ok(matchers.includes("apply_patch"), "应将 Edit|Write 转成 apply_patch");
  assert.ok(matchers.includes("exec_command"), "应将 Bash 转成 exec_command");
});

test("generate-codex-hooks 生成 user-level 绝对路径命令", () => {
  const userEntries = flattenHookEntries(buildAggregatedHooks(true));

  const userCommands = userEntries
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .filter((command) => typeof command === "string");

  assert.ok(
    userCommands.some((command) => command.includes("/plugins/")),
    "user-level hooks 应使用绝对插件路径",
  );
  assert.equal(
    userCommands.some((command) => command.includes("${CLAUDE_PLUGIN_ROOT}")),
    false,
    "不应保留未替换的 CLAUDE_PLUGIN_ROOT 占位符",
  );
});

test("generate-codex-hooks 不写项目级 .codex/hooks.json", () => {
  const check = spawnSync(process.execPath, ["scripts/generate-codex-hooks.mjs", "--check"], {
    encoding: "utf-8",
  });
  assert.equal(check.status, 0);
  assert.match(check.stdout, /does not track \.codex\/hooks\.json/);

  const write = spawnSync(process.execPath, ["scripts/generate-codex-hooks.mjs", "--write"], {
    encoding: "utf-8",
  });
  assert.notEqual(write.status, 0);
  assert.match(write.stderr, /Project-level \.codex\/hooks\.json is intentionally unsupported/);
});

test("generate-codex-hooks --write --user 尊重 CODEX_HOME", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "ai-experts-codex-hooks-"));
  const hooksPath = join(codexHome, "hooks.json");

  try {
    const write = spawnSync(process.execPath, ["scripts/generate-codex-hooks.mjs", "--write", "--user"], {
      encoding: "utf-8",
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
      },
    });

    assert.equal(write.status, 0);
    assert.equal(existsSync(hooksPath), true);
    assert.match(readFileSync(hooksPath, "utf-8"), /"hooks"/);
  } finally {
    rmSync(codexHome, { recursive: true, force: true });
  }
});
