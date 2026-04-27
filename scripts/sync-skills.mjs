#!/usr/bin/env node
/**
 * sync-skills — 把 plugins/<plugin>/skills/<id> 软链到 ~/.claude/skills/<id>
 * 与 ~/.codex/skills/<id>。
 *
 * 用法：
 *   node scripts/sync-skills.mjs               # link 到 cc + codex
 *   node scripts/sync-skills.mjs --target=cc   # 只 link Claude Code
 *   node scripts/sync-skills.mjs --target=codex
 *   node scripts/sync-skills.mjs --uninstall   # 反向解链
 *   node scripts/sync-skills.mjs --dry-run     # 不实际改动，只打印
 *
 * 命名碰撞策略：当前 479 个 skill 在仓库中已确认不重名。本脚本会做最后一道
 * 校验：若发现重名，立即报错并列出冲突源，要求人工处理。
 */

import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, renameSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const pluginsRoot = join(repoRoot, "plugins");

const TARGETS = {
  cc: process.env.CC_TARGET || join(homedir(), ".claude", "skills"),
  codex: process.env.CODEX_TARGET || join(homedir(), ".codex", "skills"),
};

function parseArgs(argv) {
  const args = { uninstall: false, dryRun: false, targets: ["cc", "codex"] };
  for (const arg of argv) {
    if (arg === "--uninstall" || arg === "-u") args.uninstall = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--target=")) {
      const t = arg.slice("--target=".length);
      if (t === "cc" || t === "codex") args.targets = [t];
      else if (t === "all") args.targets = ["cc", "codex"];
      else throw new Error(`Unknown --target value: ${t}`);
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function pathExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function symlinkPointsTo(linkPath, targetPath) {
  try {
    return realpathSync(linkPath) === realpathSync(targetPath);
  } catch {
    return false;
  }
}

function listManagedSkills() {
  if (!existsSync(pluginsRoot)) return [];
  const result = [];
  const seen = new Map();
  const plugins = readdirSync(pluginsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  for (const plugin of plugins) {
    const skillsDir = join(pluginsRoot, plugin, "skills");
    if (!existsSync(skillsDir)) continue;
    const entries = readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."));
    for (const entry of entries) {
      const id = entry.name;
      const source = join(skillsDir, id);
      // 必须含 SKILL.md 才视为可投放的 skill。本仓库习惯用 `_xxx` 命名 skill
      // 内部的运行时/共享模块（例如 docs-expert/_office_runtime），它们没有
      // SKILL.md，不应被链到 ~/.claude/skills/ 或 ~/.codex/skills/。
      if (!existsSync(join(source, "SKILL.md"))) continue;
      if (seen.has(id)) {
        throw new Error(
          `Skill name collision: "${id}" exists in both ${seen.get(id)} and ${plugin}. ` +
            `Resolve before continuing.`,
        );
      }
      seen.set(id, plugin);
      result.push({ id, plugin, source });
    }
  }
  return result;
}

function linkOne({ source, target, label, dryRun }) {
  // 同源 symlink → skip
  if (isSymlink(target) && symlinkPointsTo(target, source)) {
    return { action: "skip", reason: "already-linked" };
  }

  // 已存在（symlink 或实体）→ 备份
  if (pathExists(target)) {
    if (isSymlink(target)) {
      if (dryRun) return { action: "would-replace-symlink" };
      rmSync(target, { force: true });
    } else {
      const backup = `${target}.bak.${timestamp()}`;
      if (dryRun) return { action: "would-backup", backup };
      renameSync(target, backup);
      console.log(`  [backup] ${label}: ${target} → ${backup}`);
    }
  }

  if (dryRun) return { action: "would-link" };

  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target, "dir");
  return { action: "linked" };
}

function unlinkOne({ source, target, label, dryRun }) {
  if (!pathExists(target)) return { action: "skip", reason: "missing" };
  if (!isSymlink(target)) return { action: "skip", reason: "not-symlink" };
  if (!symlinkPointsTo(target, source)) {
    return { action: "skip", reason: "different-source" };
  }
  if (dryRun) return { action: "would-unlink" };
  rmSync(target, { force: true });
  return { action: "unlinked" };
}

// 反向扫描：清理「指向本仓库 plugins/ 但源已不存在」的 dangling symlink。
// 用于覆盖 skill 被删除或 id 被重命名后，旧 symlink 残留的场景。
// 范围严格收敛：只动指向 <repoRoot>/plugins/ 之内的 symlink，不碰其他来源。
function pruneDanglingLinks({ root, label, dryRun }) {
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
      console.log(`[prune] ${label}: would remove dangling ${linkPath} → ${linkTarget}`);
      would += 1;
      continue;
    }
    rmSync(linkPath, { force: true });
    console.log(`[prune] ${label}: removed dangling ${linkPath} → ${linkTarget}`);
    removed += 1;
  }
  return { removed, would };
}

function describe({ skill, target, mode, result, label }) {
  const tag = mode === "uninstall" ? "[unlink]" : "[link]";
  const path = `${target}/${skill.id}`;
  switch (result.action) {
    case "linked":
      return `${tag} ${label}: ${path} → ${skill.plugin}/skills/${skill.id}`;
    case "unlinked":
      return `${tag} ${label}: removed ${path}`;
    case "skip":
      return `${tag} ${label}: skip ${path} (${result.reason})`;
    case "would-link":
      return `${tag} ${label}: would link ${path}`;
    case "would-unlink":
      return `${tag} ${label}: would unlink ${path}`;
    case "would-replace-symlink":
      return `${tag} ${label}: would replace symlink ${path}`;
    case "would-backup":
      return `${tag} ${label}: would backup ${path} → ${result.backup}`;
    default:
      return `${tag} ${label}: ${path} ${result.action}`;
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`sync-skills: ${err.message}`);
    process.exit(1);
  }
  if (args.help) {
    console.log("Usage: node scripts/sync-skills.mjs [--target=cc|codex|all] [--uninstall] [--dry-run]");
    return;
  }

  const skills = listManagedSkills();
  if (skills.length === 0) {
    console.log("sync-skills: no skills found under plugins/");
    return;
  }

  const summary = { linked: 0, unlinked: 0, skipped: 0, would: 0, pruned: 0 };

  for (const targetKey of args.targets) {
    const targetRoot = TARGETS[targetKey];
    const label = targetKey === "cc" ? "claude" : "codex";

    if (!args.dryRun) mkdirSync(targetRoot, { recursive: true });

    for (const skill of skills) {
      const target = join(targetRoot, skill.id);
      const result = args.uninstall
        ? unlinkOne({ source: skill.source, target, label, dryRun: args.dryRun })
        : linkOne({ source: skill.source, target, label, dryRun: args.dryRun });

      if (result.action === "linked") summary.linked += 1;
      else if (result.action === "unlinked") summary.unlinked += 1;
      else if (result.action === "skip") summary.skipped += 1;
      else if (result.action.startsWith("would-")) summary.would += 1;

      if (process.env.AI_EXPERTS_VERBOSE === "1" || result.action !== "skip") {
        console.log(describe({ skill, target: targetRoot, mode: args.uninstall ? "uninstall" : "install", result, label }));
      }
    }

    const prune = pruneDanglingLinks({ root: targetRoot, label, dryRun: args.dryRun });
    summary.pruned += prune.removed;
    summary.would += prune.would;
  }

  const head = args.uninstall ? "sync-skills (uninstall)" : "sync-skills";
  console.log(
    `${head}: linked=${summary.linked} unlinked=${summary.unlinked} skipped=${summary.skipped} pruned=${summary.pruned}` +
      (args.dryRun ? ` would=${summary.would}` : ""),
  );
}

main();
