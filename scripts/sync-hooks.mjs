#!/usr/bin/env node
/**
 * sync-hooks — 把统一 dispatcher 注册进 ~/.claude/settings.json
 * 与 ~/.codex/hooks.json，并在 ~/.codex/config.toml 启用
 * [features] codex_hooks = true。
 *
 * 用法：
 *   node scripts/sync-hooks.mjs               # 写入 / 合并
 *   node scripts/sync-hooks.mjs --uninstall   # 移除本仓库管理的条目
 *   node scripts/sync-hooks.mjs --dry-run
 *   node scripts/sync-hooks.mjs --target=cc | --target=codex
 *
 * 合并策略：
 *   - 我们识别「自己管理的 hook 条目」依据 command 中是否包含
 *     <repoRoot>/hooks/dispatch.mjs。先剔除旧的同源条目，再追加新的，
 *     保留用户自定义的其他 hook 不动。
 *   - settings.json / config.toml 的非 hooks 字段保持原样。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const dispatchScript = join(repoRoot, "hooks", "dispatch.mjs");

const CLAUDE_SETTINGS = process.env.CLAUDE_SETTINGS_PATH || join(homedir(), ".claude", "settings.json");
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const CODEX_HOOKS_JSON = join(CODEX_HOME, "hooks.json");
const CODEX_CONFIG_TOML = join(CODEX_HOME, "config.toml");

// ── dispatcher 路由表 ─────────────────────────────────
// claude.matcher: 写入 settings.json 时使用的 matcher
// codex:         null 表示 Codex 不支持该事件；否则给出 Codex 端的 matcher
//                （Codex 把 Edit|Write 等价为 apply_patch；UserPromptSubmit/Stop/
//                SessionStart 不需要 matcher，留空）
const DISPATCHERS = [
  { event: "PreToolUse",       claudeMatcher: "Bash",       subdir: "pre-tool-use/bash",       timeout: 15, codex: { matcher: "Bash" } },
  { event: "PreToolUse",       claudeMatcher: "Edit|Write", subdir: "pre-tool-use/edit-write", timeout: 15, codex: { matcher: "apply_patch" } },
  { event: "PostToolUse",      claudeMatcher: "Bash",       subdir: "post-tool-use/bash",      timeout: 30, codex: { matcher: "Bash" } },
  { event: "PostToolUse",      claudeMatcher: "Edit|Write", subdir: "post-tool-use/edit-write", timeout: 30, codex: { matcher: "apply_patch" } },
  { event: "UserPromptSubmit", claudeMatcher: ".*",         subdir: "user-prompt-submit",      timeout: 15, codex: { matcher: "" } },
  { event: "Notification",     claudeMatcher: ".*",         subdir: "notification",            timeout: 10, codex: null },
  { event: "Stop",             claudeMatcher: ".*",         subdir: "stop",                    timeout: 15, codex: { matcher: "" } },
  { event: "SessionStart",     claudeMatcher: ".*",         subdir: "session-start",           timeout: 15, codex: { matcher: "" } },
  { event: "PreCompact",       claudeMatcher: ".*",         subdir: "pre-compact",             timeout: 10, codex: null },
];

function parseArgs(argv) {
  const args = { uninstall: false, dryRun: false, targets: ["cc", "codex"] };
  for (const arg of argv) {
    if (arg === "--uninstall" || arg === "-u") args.uninstall = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--target=")) {
      const t = arg.slice("--target=".length);
      if (t === "cc" || t === "codex") args.targets = [t];
      else if (t === "all") args.targets = ["cc", "codex"];
      else throw new Error(`Unknown --target: ${t}`);
    } else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function normalizeCommand(cmd) {
  return typeof cmd === "string" ? cmd.replaceAll("\\", "/") : "";
}

function isManagedCommand(cmd) {
  const norm = normalizeCommand(cmd);
  if (!norm) return false;
  const dispatchNorm = dispatchScript.replaceAll("\\", "/");
  return norm.includes(dispatchNorm);
}

function buildClaudeEntries() {
  const entries = {};
  for (const d of DISPATCHERS) {
    if (!entries[d.event]) entries[d.event] = [];
    entries[d.event].push({
      matcher: d.claudeMatcher,
      hooks: [{
        type: "command",
        command: `node ${dispatchScript} ${d.subdir}`,
        timeout: d.timeout,
      }],
    });
  }
  return entries;
}

function buildCodexEntries() {
  const entries = {};
  for (const d of DISPATCHERS) {
    if (!d.codex) continue;
    if (!entries[d.event]) entries[d.event] = [];
    const entry = {
      hooks: [{
        type: "command",
        command: `node ${dispatchScript} ${d.subdir}`,
        timeout: d.timeout,
      }],
    };
    // Codex 文档：matcher 为空可省略字段；为兼容性统一保留。
    entry.matcher = d.codex.matcher;
    entries[d.event].push(entry);
  }
  return entries;
}

function stripManagedFromHooks(hooks) {
  if (!hooks || typeof hooks !== "object") return {};
  const next = {};
  for (const [event, list] of Object.entries(hooks)) {
    if (!Array.isArray(list)) {
      next[event] = list;
      continue;
    }
    const cleaned = list
      .map((entry) => {
        if (!entry || !Array.isArray(entry.hooks)) return entry;
        const remaining = entry.hooks.filter((h) => !isManagedCommand(h.command));
        if (remaining.length === 0) return null;
        return { ...entry, hooks: remaining };
      })
      .filter(Boolean);
    if (cleaned.length > 0) next[event] = cleaned;
  }
  return next;
}

function mergeHooks(existing, managed) {
  const stripped = stripManagedFromHooks(existing);
  for (const [event, list] of Object.entries(managed)) {
    stripped[event] = [...(stripped[event] ?? []), ...list];
  }
  return stripped;
}

// ── Claude Code (settings.json) ──────────────────────

function syncClaude({ uninstall, dryRun }) {
  let settings = {};
  let raw = null;
  if (existsSync(CLAUDE_SETTINGS)) {
    raw = readFileSync(CLAUDE_SETTINGS, "utf-8");
    try {
      settings = JSON.parse(raw);
    } catch (err) {
      throw new Error(`无法解析 ${CLAUDE_SETTINGS}: ${err.message}`);
    }
  }

  const managed = buildClaudeEntries();
  const nextHooks = uninstall
    ? stripManagedFromHooks(settings.hooks)
    : mergeHooks(settings.hooks, managed);

  const nextSettings = { ...settings };
  if (Object.keys(nextHooks).length > 0) {
    nextSettings.hooks = nextHooks;
  } else {
    delete nextSettings.hooks;
  }

  // 卸载且文件原本就不存在，不要凭空建一个空文件。
  if (uninstall && raw === null && Object.keys(nextSettings).length === 0) {
    console.log(`sync-hooks claude: 文件不存在，无需处理 (${CLAUDE_SETTINGS})`);
    return;
  }

  const target = JSON.stringify(nextSettings, null, 2) + "\n";
  if (raw === target) {
    console.log(`sync-hooks claude: 无变化 (${CLAUDE_SETTINGS})`);
    return;
  }
  if (dryRun) {
    console.log(`sync-hooks claude: would update ${CLAUDE_SETTINGS}`);
    return;
  }
  mkdirSync(dirname(CLAUDE_SETTINGS), { recursive: true });
  writeFileSync(CLAUDE_SETTINGS, target, "utf-8");
  console.log(`sync-hooks claude: ${uninstall ? "removed managed hooks" : "wrote"} ${CLAUDE_SETTINGS}`);
}

// ── Codex (hooks.json + config.toml) ─────────────────

function syncCodexHooksJson({ uninstall, dryRun }) {
  let raw = null;
  let existing = { hooks: {} };
  if (existsSync(CODEX_HOOKS_JSON)) {
    raw = readFileSync(CODEX_HOOKS_JSON, "utf-8");
    try {
      existing = JSON.parse(raw);
      if (!existing || typeof existing !== "object") existing = { hooks: {} };
    } catch (err) {
      throw new Error(`无法解析 ${CODEX_HOOKS_JSON}: ${err.message}`);
    }
  }

  const managed = buildCodexEntries();
  const nextHooks = uninstall
    ? stripManagedFromHooks(existing.hooks)
    : mergeHooks(existing.hooks, managed);

  const next = { ...existing, hooks: nextHooks };
  if (Object.keys(nextHooks).length === 0) {
    delete next.hooks;
  }

  // 卸载且文件原本就不存在，不要凭空建一个空文件。
  if (uninstall && raw === null && Object.keys(next).length === 0) {
    console.log(`sync-hooks codex: 文件不存在，无需处理 (${CODEX_HOOKS_JSON})`);
    return;
  }

  const target = JSON.stringify(next, null, 2) + "\n";
  if (raw === target) {
    console.log(`sync-hooks codex: 无变化 (${CODEX_HOOKS_JSON})`);
    return;
  }
  if (dryRun) {
    console.log(`sync-hooks codex: would update ${CODEX_HOOKS_JSON}`);
    return;
  }
  mkdirSync(dirname(CODEX_HOOKS_JSON), { recursive: true });
  writeFileSync(CODEX_HOOKS_JSON, target, "utf-8");
  console.log(`sync-hooks codex: ${uninstall ? "removed managed hooks" : "wrote"} ${CODEX_HOOKS_JSON}`);
}

/**
 * 在 config.toml 中启用 [features] codex_hooks = true。
 * 零依赖 TOML 编辑：只匹配顶层 section header 与 key=value 行。
 */
function enableCodexFeature(content) {
  const lines = content.split("\n");
  let featuresHeaderIdx = -1;
  let codexHookLineIdx = -1;
  let codexHookValue = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "" || line.startsWith("#")) continue;
    const header = line.match(/^\[([^[\]]+)\]$/);
    if (header) {
      currentSection = header[1].trim();
      if (currentSection === "features") featuresHeaderIdx = i;
      continue;
    }
    if (currentSection === "features") {
      const kv = line.match(/^codex_hooks\s*=\s*(.+?)\s*(?:#.*)?$/);
      if (kv) {
        codexHookLineIdx = i;
        codexHookValue = kv[1].trim();
      }
    }
  }

  if (codexHookLineIdx >= 0 && codexHookValue === "true") {
    return { content, changed: false, action: "already-enabled" };
  }
  if (codexHookLineIdx >= 0) {
    lines[codexHookLineIdx] = "codex_hooks = true";
    return { content: lines.join("\n"), changed: true, action: "value-updated" };
  }
  if (featuresHeaderIdx >= 0) {
    lines.splice(featuresHeaderIdx + 1, 0, "codex_hooks = true");
    return { content: lines.join("\n"), changed: true, action: "key-inserted" };
  }
  const needsBlank = lines.length > 0 && lines[lines.length - 1].trim() !== "";
  if (needsBlank) lines.push("");
  lines.push("[features]");
  lines.push("codex_hooks = true");
  if (lines[lines.length - 1] !== "") lines.push("");
  return { content: lines.join("\n"), changed: true, action: "section-appended" };
}

function syncCodexConfigToml({ dryRun }) {
  let before = "";
  if (existsSync(CODEX_CONFIG_TOML)) {
    before = readFileSync(CODEX_CONFIG_TOML, "utf-8");
  }
  const { content, changed, action } = enableCodexFeature(before);
  if (!changed) {
    console.log(`sync-hooks codex: ${CODEX_CONFIG_TOML} (${action})`);
    return;
  }
  if (dryRun) {
    console.log(`sync-hooks codex: would update ${CODEX_CONFIG_TOML} (${action})`);
    return;
  }
  mkdirSync(dirname(CODEX_CONFIG_TOML), { recursive: true });
  writeFileSync(CODEX_CONFIG_TOML, content, "utf-8");
  console.log(`sync-hooks codex: updated ${CODEX_CONFIG_TOML} (${action})`);
}

// ── 旧版残留清理（卸载时）──────────────────────────
// 历史上的安装脚本（旧 install.sh，现已替换为 install.mjs）可能在
// ~/.codex/config.toml 写过：
//   [marketplaces.ai-experts]
//   [plugins."<name>@ai-experts"]
// 卸载阶段顺手清掉。
function stripCodexLegacySections({ dryRun }) {
  if (!existsSync(CODEX_CONFIG_TOML)) return;
  const before = readFileSync(CODEX_CONFIG_TOML, "utf-8");
  const lines = before.split("\n");
  const out = [];
  let skip = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[marketplaces\.ai-experts\]/.test(trimmed) ||
        /^\[plugins\."[^"]*@ai-experts"\]/.test(trimmed)) {
      skip = true;
      continue;
    }
    if (skip && /^\[/.test(trimmed)) skip = false;
    if (!skip) out.push(line);
  }
  // 折叠多余空行
  const collapsed = out.join("\n").replace(/\n{3,}/g, "\n\n");
  if (collapsed === before) return;
  if (dryRun) {
    console.log(`sync-hooks codex: would strip legacy marketplace/plugin entries`);
    return;
  }
  writeFileSync(CODEX_CONFIG_TOML, collapsed, "utf-8");
  console.log(`sync-hooks codex: stripped legacy marketplace/plugin entries from ${CODEX_CONFIG_TOML}`);
}

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (err) { console.error(`sync-hooks: ${err.message}`); process.exit(1); }
  if (args.help) {
    console.log("Usage: node scripts/sync-hooks.mjs [--target=cc|codex|all] [--uninstall] [--dry-run]");
    return;
  }

  if (!existsSync(dispatchScript)) {
    console.error(`sync-hooks: 缺少 dispatch 入口 ${dispatchScript}`);
    process.exit(1);
  }

  for (const t of args.targets) {
    if (t === "cc") {
      syncClaude({ uninstall: args.uninstall, dryRun: args.dryRun });
    } else if (t === "codex") {
      syncCodexHooksJson({ uninstall: args.uninstall, dryRun: args.dryRun });
      if (args.uninstall) {
        stripCodexLegacySections({ dryRun: args.dryRun });
      } else {
        syncCodexConfigToml({ dryRun: args.dryRun });
      }
    }
  }
}

main();
