#!/usr/bin/env node
/**
 * sync-agents — 把 plugins/<plugin>/agents/<name>.md 软链到 ~/.claude/agents/<name>.md。
 *
 * Codex 的 subagent 协议与 Claude Code 不同，本脚本只处理 Claude 侧。
 *
 * 用法：
 *   node scripts/sync-agents.mjs               # link
 *   node scripts/sync-agents.mjs --uninstall   # 反向解链
 *   node scripts/sync-agents.mjs --dry-run
 */

import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const pluginsRoot = join(repoRoot, "plugins");
const TARGET_ROOT = process.env.CC_AGENTS_TARGET || join(homedir(), ".claude", "agents");

function parseArgs(argv) {
  const args = { uninstall: false, dryRun: false };
  for (const arg of argv) {
    if (arg === "--uninstall" || arg === "-u") args.uninstall = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function isSymlink(p) {
  try { return lstatSync(p).isSymbolicLink(); } catch { return false; }
}
function pathExists(p) {
  try { lstatSync(p); return true; } catch { return false; }
}
function symlinkPointsTo(linkPath, targetPath) {
  try { return realpathSync(linkPath) === realpathSync(targetPath); } catch { return false; }
}

function listManagedAgents() {
  if (!existsSync(pluginsRoot)) return [];
  const result = [];
  const seen = new Map();
  const plugins = readdirSync(pluginsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  for (const plugin of plugins) {
    const agentsDir = join(pluginsRoot, plugin, "agents");
    if (!existsSync(agentsDir)) continue;
    const entries = readdirSync(agentsDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md"));
    for (const entry of entries) {
      const id = entry.name;
      if (seen.has(id)) {
        throw new Error(
          `Agent name collision: "${id}" exists in both ${seen.get(id)} and ${plugin}.`,
        );
      }
      seen.set(id, plugin);
      result.push({ id, plugin, source: join(agentsDir, id) });
    }
  }
  return result;
}

function linkOne({ source, target, dryRun }) {
  if (isSymlink(target) && symlinkPointsTo(target, source)) {
    return { action: "skip", reason: "already-linked" };
  }
  if (pathExists(target)) {
    if (isSymlink(target)) {
      if (dryRun) return { action: "would-replace-symlink" };
      rmSync(target, { force: true });
    } else {
      const backup = `${target}.bak.${timestamp()}`;
      if (dryRun) return { action: "would-backup", backup };
      renameSync(target, backup);
      console.log(`  [backup] claude: ${target} → ${backup}`);
    }
  }
  if (dryRun) return { action: "would-link" };
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target, "file");
  return { action: "linked" };
}

function unlinkOne({ source, target, dryRun }) {
  if (!pathExists(target)) return { action: "skip", reason: "missing" };
  if (!isSymlink(target)) return { action: "skip", reason: "not-symlink" };
  if (!symlinkPointsTo(target, source)) return { action: "skip", reason: "different-source" };
  if (dryRun) return { action: "would-unlink" };
  rmSync(target, { force: true });
  return { action: "unlinked" };
}

// 反向扫描：清理「指向本仓库 plugins/ 但源已不存在」的 dangling symlink。
// 覆盖 agent 文件被删除或重命名后旧 symlink 残留的场景。
function pruneDanglingLinks({ root, dryRun }) {
  if (!existsSync(root)) return { removed: 0, would: 0 };
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return { removed: 0, would: 0 };
  }
  const pluginsPrefix = pluginsRoot.endsWith("/") ? pluginsRoot : pluginsRoot + "/";
  let removed = 0;
  let would = 0;
  for (const entry of entries) {
    if (!entry.isSymbolicLink()) continue;
    const linkPath = join(root, entry.name);
    let linkTarget;
    try {
      linkTarget = readlinkSync(linkPath);
    } catch {
      continue;
    }
    const absTarget = resolve(root, linkTarget);
    if (absTarget !== pluginsRoot && !absTarget.startsWith(pluginsPrefix)) continue;
    if (existsSync(absTarget)) continue;
    if (dryRun) {
      console.log(`[prune] claude/agents: would remove dangling ${linkPath} → ${linkTarget}`);
      would += 1;
      continue;
    }
    rmSync(linkPath, { force: true });
    console.log(`[prune] claude/agents: removed dangling ${linkPath} → ${linkTarget}`);
    removed += 1;
  }
  return { removed, would };
}

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (err) { console.error(`sync-agents: ${err.message}`); process.exit(1); }
  if (args.help) {
    console.log("Usage: node scripts/sync-agents.mjs [--uninstall] [--dry-run]");
    return;
  }

  const agents = listManagedAgents();
  if (agents.length === 0) {
    // 即使仓库里没有 agent，也要清掉历史残留的孤儿链接。
    const prune = pruneDanglingLinks({ root: TARGET_ROOT, dryRun: args.dryRun });
    const head = args.uninstall ? "sync-agents (uninstall)" : "sync-agents";
    console.log(
      `${head}: no agents found under plugins/. pruned=${prune.removed}` +
        (args.dryRun ? ` would=${prune.would}` : ""),
    );
    return;
  }

  if (!args.dryRun) mkdirSync(TARGET_ROOT, { recursive: true });

  const summary = { linked: 0, unlinked: 0, skipped: 0, would: 0, pruned: 0 };

  for (const agent of agents) {
    const target = join(TARGET_ROOT, agent.id);
    const result = args.uninstall
      ? unlinkOne({ source: agent.source, target, dryRun: args.dryRun })
      : linkOne({ source: agent.source, target, dryRun: args.dryRun });

    if (result.action === "linked") summary.linked += 1;
    else if (result.action === "unlinked") summary.unlinked += 1;
    else if (result.action === "skip") summary.skipped += 1;
    else if (result.action.startsWith("would-")) summary.would += 1;

    const tag = args.uninstall ? "[unlink]" : "[link]";
    if (process.env.AI_EXPERTS_VERBOSE === "1" || result.action !== "skip") {
      console.log(`${tag} claude/agents: ${agent.id} (${result.action})`);
    }
  }

  const prune = pruneDanglingLinks({ root: TARGET_ROOT, dryRun: args.dryRun });
  summary.pruned += prune.removed;
  summary.would += prune.would;

  const head = args.uninstall ? "sync-agents (uninstall)" : "sync-agents";
  console.log(
    `${head}: linked=${summary.linked} unlinked=${summary.unlinked} skipped=${summary.skipped} pruned=${summary.pruned}` +
      (args.dryRun ? ` would=${summary.would}` : ""),
  );
}

main();
