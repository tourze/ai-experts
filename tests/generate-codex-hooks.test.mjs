import assert from "node:assert/strict";
import test from "node:test";

import { buildAggregatedHooks } from "../scripts/generate-codex-hooks.mjs";

function flattenHookEntries(config) {
  return Object.values(config.hooks ?? {}).flat();
}

test("generate-codex-hooks 输出中不保留 Claude matcher", () => {
  const aggregated = buildAggregatedHooks(false);
  const entries = flattenHookEntries(aggregated);
  const matchers = entries.map((entry) => entry.matcher);

  assert.ok(matchers.length > 0, "应生成至少一条 hook 规则");
  assert.equal(matchers.includes("Edit|Write"), false, "Codex hooks 不能保留 Edit|Write matcher");
  assert.equal(matchers.includes("Bash"), false, "Codex hooks 不能保留 Bash matcher");
  assert.ok(matchers.includes("apply_patch"), "应将 Edit|Write 转成 apply_patch");
  assert.ok(matchers.includes("exec_command"), "应将 Bash 转成 exec_command");
});

test("generate-codex-hooks 同时支持 project/user 路径模式", () => {
  const projectEntries = flattenHookEntries(buildAggregatedHooks(false));
  const userEntries = flattenHookEntries(buildAggregatedHooks(true));

  const projectCommands = projectEntries
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .filter((command) => typeof command === "string");
  const userCommands = userEntries
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .filter((command) => typeof command === "string");

  assert.ok(
    projectCommands.some((command) => command.includes("./plugins/")),
    "project-level hooks 应使用相对插件路径",
  );
  assert.ok(
    userCommands.some((command) => command.includes("/plugins/")),
    "user-level hooks 应使用绝对插件路径",
  );
  assert.equal(
    projectCommands.some((command) => command.includes("${CLAUDE_PLUGIN_ROOT}")),
    false,
    "不应保留未替换的 CLAUDE_PLUGIN_ROOT 占位符",
  );
  assert.equal(
    userCommands.some((command) => command.includes("${CLAUDE_PLUGIN_ROOT}")),
    false,
    "不应保留未替换的 CLAUDE_PLUGIN_ROOT 占位符",
  );
});
