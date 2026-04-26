#!/usr/bin/env node
/**
 * cleanup-legacy — 清理旧 marketplace 体系（claude plugin install / codex
 * marketplace add）留下的物理目录与配置段。
 *
 * 用法：
 *   node scripts/cleanup-legacy.mjs --target=cc       # 仅 Claude Code
 *   node scripts/cleanup-legacy.mjs --target=codex    # 仅 Codex
 *   node scripts/cleanup-legacy.mjs                   # 两端都跑
 *   node scripts/cleanup-legacy.mjs --dry-run
 *
 * 设计原则：
 *   - Idempotent：无残留时静默退出（除非 --verbose）
 *   - Best-effort：单步失败不影响其他步骤
 *   - 与 sync-hooks 解耦：本脚本不动 hooks.json / settings.json，只清遗物
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKETPLACE = "ai-experts";
const HOME = homedir();
const CLAUDE_HOME = join(HOME, ".claude");
const CODEX_HOME = process.env.CODEX_HOME || join(HOME, ".codex");
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { dryRun: false, verbose: false, targets: ["cc", "codex"] };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--verbose") args.verbose = true;
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

function info(msg) { console.log(`  ${msg}`); }
function ok(msg) { console.log(`  \x1b[32m[ok]\x1b[0m ${msg}`); }

function safeRmDir(path, { dryRun }) {
  if (!existsSync(path)) return false;
  if (dryRun) {
    info(`would: rm -rf ${path}`);
    return false;
  }
  rmSync(path, { recursive: true, force: true });
  ok(`removed ${path}`);
  return true;
}

// ── Claude Code ──────────────────────────────────────

function claudeListInstalled() {
  try {
    const json = execFileSync("claude", ["plugin", "list", "--json"], {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
      timeout: 10_000,
    });
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [];
    const suffix = `@${MARKETPLACE}`;
    return arr
      .filter((p) => p?.scope === "user" && typeof p?.id === "string" && p.id.endsWith(suffix))
      .map((p) => p.id.slice(0, -suffix.length));
  } catch {
    return [];
  }
}

function claudeHasLegacy() {
  if (existsSync(join(CLAUDE_HOME, "plugins", "cache", MARKETPLACE))) return true;
  const dataRoot = join(CLAUDE_HOME, "plugins", "data");
  if (existsSync(dataRoot)) {
    const matched = readdirSync(dataRoot).some((d) => d.endsWith(`-${MARKETPLACE}`));
    if (matched) return true;
  }
  if (claudeListInstalled().length > 0) return true;
  return false;
}

function cleanupClaude({ dryRun, verbose }) {
  if (!claudeHasLegacy()) {
    if (verbose) info("Claude Code: 无旧版残留");
    return;
  }
  console.log("Claude Code: 清理旧版 marketplace 残留（best-effort）...");

  // 1. CLI 层卸载（清 installed_plugins.json）
  for (const name of claudeListInstalled()) {
    if (dryRun) { info(`would: claude plugin uninstall ${name}`); continue; }
    try {
      execFileSync("claude", ["plugin", "uninstall", name], {
        stdio: "ignore", timeout: 10_000,
      });
      ok(`claude plugin uninstall ${name}`);
    } catch {/* best-effort */}
  }

  // 2. 移除 marketplace 注册（清 known_marketplaces.json）
  if (dryRun) {
    info(`would: claude plugin marketplace remove ${MARKETPLACE}`);
  } else {
    try {
      execFileSync("claude", ["plugin", "marketplace", "remove", MARKETPLACE], {
        stdio: "ignore", timeout: 10_000,
      });
      ok(`claude plugin marketplace remove ${MARKETPLACE}`);
    } catch {/* best-effort: claude 未装 / marketplace 已不存在 */}
  }

  // 3. 物理残留：claude CLI 不删 cache 与 data 子目录
  safeRmDir(join(CLAUDE_HOME, "plugins", "cache", MARKETPLACE), { dryRun });
  const dataRoot = join(CLAUDE_HOME, "plugins", "data");
  if (existsSync(dataRoot)) {
    for (const entry of readdirSync(dataRoot)) {
      if (!entry.endsWith(`-${MARKETPLACE}`)) continue;
      safeRmDir(join(dataRoot, entry), { dryRun });
    }
  }
}

// ── Codex CLI ────────────────────────────────────────

function codexConfigToml() {
  return join(CODEX_HOME, "config.toml");
}

function codexHasLegacy() {
  if (existsSync(join(CODEX_HOME, "plugins", "cache", MARKETPLACE))) return true;
  const tomlPath = codexConfigToml();
  if (existsSync(tomlPath)) {
    const text = readFileSync(tomlPath, "utf-8");
    if (/^\[(marketplaces\.ai-experts|plugins\."[^"]*@ai-experts")/m.test(text)) return true;
  }
  if (codexHistoryLegacyCount() > 0) return true;
  return false;
}

function listAiExpertsPluginNames() {
  const dir = join(REPO_ROOT, "plugins");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

function buildLegacyPromptRegex() {
  const names = listAiExpertsPluginNames();
  if (names.length === 0) return null;
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`^\\$(${escaped}):`);
}

function codexHistoryLegacyCount() {
  const histPath = join(CODEX_HOME, "history.jsonl");
  if (!existsSync(histPath)) return 0;
  const re = buildLegacyPromptRegex();
  if (!re) return 0;
  let count = 0;
  for (const line of readFileSync(histPath, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (typeof entry?.text === "string" && re.test(entry.text)) count += 1;
    } catch {/* keep going */}
  }
  return count;
}

function codexIsRunning() {
  try {
    const out = execFileSync("pgrep", ["-x", "codex"], {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
      timeout: 2_000,
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function cleanCodexHistory({ dryRun, verbose }) {
  const histPath = join(CODEX_HOME, "history.jsonl");
  if (!existsSync(histPath)) {
    if (verbose) info("history.jsonl 不存在，跳过");
    return;
  }
  const re = buildLegacyPromptRegex();
  if (!re) {
    if (verbose) info("plugins/ 为空，跳过 history 过滤");
    return;
  }
  const before = readFileSync(histPath, "utf-8");
  const lines = before.split("\n");
  const out = [];
  let removed = 0;
  for (const line of lines) {
    if (!line.trim()) { out.push(line); continue; }
    try {
      const entry = JSON.parse(line);
      if (typeof entry?.text === "string" && re.test(entry.text)) {
        removed += 1;
        continue;
      }
    } catch {/* 不是合法 JSON 行，保留 */}
    out.push(line);
  }
  if (removed === 0) {
    if (verbose) info("history.jsonl 无 ai-experts namespaced 条目");
    return;
  }
  if (dryRun) {
    info(`would: 从 ${histPath} 删除 ${removed} 条 plugin-namespaced prompt`);
    return;
  }
  if (codexIsRunning()) {
    console.error(`  \x1b[31m[error]\x1b[0m Codex 进程在运行，拒绝 rewrite history.jsonl`);
    console.error(`           请先退出所有 codex 会话再运行此清理`);
    process.exitCode = 2;
    return;
  }
  const tmp = `${histPath}.cleanup.tmp`;
  writeFileSync(tmp, out.join("\n"), "utf-8");
  renameSync(tmp, histPath);
  ok(`removed ${removed} legacy plugin-namespaced entries from ${histPath}`);
}

function stripCodexLegacySections(content) {
  const lines = content.split("\n");
  const out = [];
  let skip = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isLegacy =
      /^\[marketplaces\.ai-experts\]/.test(trimmed) ||
      /^\[plugins\."[^"]*@ai-experts"\]/.test(trimmed);
    if (isLegacy) { skip = true; continue; }
    if (skip && /^\[/.test(trimmed)) skip = false;
    if (!skip) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function cleanupCodex({ dryRun, verbose }) {
  if (!codexHasLegacy()) {
    if (verbose) info("Codex CLI: 无旧版残留");
    return;
  }
  console.log("Codex CLI: 清理旧版 marketplace 残留（best-effort）...");

  safeRmDir(join(CODEX_HOME, "plugins", "cache", MARKETPLACE), { dryRun });

  const tomlPath = codexConfigToml();
  if (existsSync(tomlPath)) {
    const before = readFileSync(tomlPath, "utf-8");
    const after = stripCodexLegacySections(before);
    if (after !== before) {
      if (dryRun) {
        info(`would: strip [marketplaces.ai-experts] / [plugins."*@ai-experts"] from ${tomlPath}`);
      } else {
        writeFileSync(tomlPath, after, "utf-8");
        ok(`stripped legacy sections from ${tomlPath}`);
      }
    }
  }

  cleanCodexHistory({ dryRun, verbose });
}

// ── main ─────────────────────────────────────────────

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (err) { console.error(`cleanup-legacy: ${err.message}`); process.exit(1); }
  if (args.help) {
    console.log("Usage: node scripts/cleanup-legacy.mjs [--target=cc|codex|all] [--dry-run] [--verbose]");
    return;
  }
  for (const t of args.targets) {
    if (t === "cc") cleanupClaude(args);
    else if (t === "codex") cleanupCodex(args);
  }
}

main();
