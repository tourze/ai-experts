#!/usr/bin/env node
/**
 * ai-experts installer (post-marketplace).
 *
 * 不再使用 Claude Code / Codex 的 marketplace + plugin install 体系，
 * 而是直接：
 *   - 把每个 plugins/<plugin>/skills/<id> 软链到 ~/.claude/skills/<id>
 *     与 ~/.codex/skills/<id>
 *   - 把每个 plugins/<plugin>/agents/<name>.md 软链到 ~/.claude/agents/<name>.md
 *   - 把统一 dispatcher 写进 ~/.claude/settings.json 与 ~/.codex/hooks.json
 *   - 启用 Codex CLI 所需 feature flags（codex_hooks / goals）
 *   - 把仓库 MEMORY.md 软链到各 CLI 的全局记忆文件
 *   - 同步插件目录下 .mcp.json 声明的 MCP；缺少必需 env 时移除对应托管条目
 *
 * 用法：
 *   node scripts/install.mjs              # 全部安装
 *   node scripts/install.mjs --uninstall  # 全部卸载
 *   node scripts/install.mjs --reinstall  # 卸载后再装
 *   node scripts/install.mjs --dry-run    # 仅打印，不改动
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  renameSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const CODEX_HOME_DIR = process.env.CODEX_HOME || join(homedir(), ".codex");
const MEMORY_SOURCE = join(REPO_ROOT, "MEMORY.md");
const CLAUDE_MEMORY_TARGET = process.env.CLAUDE_MEMORY_TARGET || join(homedir(), ".claude", "CLAUDE.md");
const CODEX_MEMORY_TARGET = process.env.CODEX_MEMORY_TARGET || join(CODEX_HOME_DIR, "AGENTS.md");
const CODEX_FEATURE_FLAGS = ["codex_hooks", "goals"];

let DRY_RUN = false;

// ── helpers ──────────────────────────────────────────────────

const C = {
  blue: "\x1b[1;34m",
  green: "\x1b[1;32m",
  yellow: "\x1b[1;33m",
  red: "\x1b[1;31m",
  reset: "\x1b[0m",
};

const info = (msg) => console.log(`${C.blue}[info]${C.reset}  ${msg}`);
const ok = (msg) => console.log(`${C.green}[ok]${C.reset}    ${msg}`);
const warn = (msg) => console.log(`${C.yellow}[warn]${C.reset}  ${msg}`);
const err = (msg) => console.error(`${C.red}[error]${C.reset} ${msg}`);

function hasCmd(cmd) {
  // cmd 来自代码内常量（claude / codex），不接受外部输入；正则限制后再交给
  // POSIX `command -v` 探测可执行性。
  if (!/^[A-Za-z0-9_.-]+$/.test(cmd)) {
    throw new Error(`invalid command name: ${cmd}`);
  }
  const r = spawnSync("/bin/sh", ["-c", `command -v ${cmd} >/dev/null 2>&1`], { stdio: "ignore" });
  return r.status === 0;
}

function lstatOrNull(p) {
  try { return lstatSync(p); } catch { return null; }
}

// ── memory file 软链 ─────────────────────────────────────────

function isLinkedTo(target, source) {
  const ls = lstatOrNull(target);
  if (!ls || !ls.isSymbolicLink()) return false;
  let link;
  try { link = readlinkSync(target); } catch { return false; }
  const resolved = resolve(dirname(target), link);
  return resolved === resolve(source);
}

function backupExistingFile(target) {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const backup = `${target}.bak.${ts}`;
  renameSync(target, backup);
  warn(`Backed up existing memory file: ${target} -> ${backup}`);
}

function linkMemoryFile(label, target) {
  if (!existsSync(MEMORY_SOURCE)) {
    err(`Shared memory source not found: ${MEMORY_SOURCE}`);
    throw new Error("missing memory source");
  }

  const ls = lstatOrNull(target);
  if (ls && ls.isDirectory() && !ls.isSymbolicLink()) {
    err(`${label}: memory target is a directory, cannot link: ${target}`);
    throw new Error("memory target is a directory");
  }

  if (isLinkedTo(target, MEMORY_SOURCE)) {
    ok(`${label}: memory already linked (${target})`);
    return;
  }

  if (DRY_RUN) {
    info(`${label}: would link ${target} → ${MEMORY_SOURCE}`);
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  if (ls) backupExistingFile(target);
  symlinkSync(MEMORY_SOURCE, target);
  ok(`${label}: linked memory ${target} → ${MEMORY_SOURCE}`);
}

function unlinkMemoryFile(label, target) {
  if (isLinkedTo(target, MEMORY_SOURCE)) {
    if (DRY_RUN) {
      info(`${label}: would unlink ${target}`);
      return;
    }
    unlinkSync(target);
    ok(`${label}: removed memory link (${target})`);
    return;
  }
  info(`${label}: leaving memory target unchanged (${target})`);
}

// ── 子脚本调用 ───────────────────────────────────────────────

function runNode(scriptName, extra = []) {
  const args = [join(SCRIPT_DIR, scriptName)];
  if (DRY_RUN) args.push("--dry-run");
  args.push(...extra);
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) {
    const e = new Error(`${scriptName} exited ${r.status}`);
    e.exitCode = r.status ?? 1;
    throw e;
  }
}

function auditSkillEvals() {
  const script = join(SCRIPT_DIR, "audit-skill-evals.mjs");
  if (!existsSync(script)) return;
  // best-effort：审计失败不阻塞安装流程
  spawnSync(process.execPath, [script], { stdio: "inherit" });
}

// ── 旧版残留清理（向后兼容） ─────────────────────────────────
// 详细逻辑（CLI uninstall + marketplace remove + 物理 cache/data 删除 +
// config.toml 段剥离）在 scripts/cleanup-legacy.mjs。无残留时静默退出。

function claudeLegacyCleanup() {
  if (!hasCmd("claude")) return;
  runNode("cleanup-legacy.mjs", ["--target=cc"]);
}

function codexLegacyCleanup() {
  if (!hasCmd("codex")) return;
  runNode("cleanup-legacy.mjs", ["--target=codex"]);
}

// ── Claude Code ──────────────────────────────────────────────

function claudeInstall() {
  claudeLegacyCleanup();

  info("Claude Code: 同步 skills...");
  runNode("sync-skills.mjs", ["--target=cc"]);

  info("Claude Code: 同步 agents...");
  runNode("sync-agents.mjs");

  info("Claude Code: 注册统一 hooks...");
  runNode("sync-hooks.mjs", ["--target=cc"]);

  info("Claude Code: 同步插件 MCP...");
  runNode("sync-mcp.mjs", ["--target=cc"]);

  info("Claude Code: 链接共享记忆...");
  linkMemoryFile("Claude Code", CLAUDE_MEMORY_TARGET);

  ok("Claude Code: done.");
}

function claudeUninstall() {
  info("Claude Code: 解链 skills...");
  runNode("sync-skills.mjs", ["--target=cc", "--uninstall"]);

  info("Claude Code: 解链 agents...");
  runNode("sync-agents.mjs", ["--uninstall"]);

  info("Claude Code: 移除统一 hooks 条目...");
  runNode("sync-hooks.mjs", ["--target=cc", "--uninstall"]);

  info("Claude Code: 移除插件 MCP...");
  runNode("sync-mcp.mjs", ["--target=cc", "--uninstall"]);

  info("Claude Code: 移除共享记忆链接...");
  unlinkMemoryFile("Claude Code", CLAUDE_MEMORY_TARGET);

  claudeLegacyCleanup();

  ok("Claude Code: uninstalled.");
}

// ── Codex CLI ────────────────────────────────────────────────

function codexInstall() {
  codexLegacyCleanup();

  info(`Codex CLI: 启用 feature flags (${CODEX_FEATURE_FLAGS.join(", ")})...`);
  if (hasCmd("codex")) {
    for (const feature of CODEX_FEATURE_FLAGS) {
      if (DRY_RUN) {
        info(`  would: codex features enable ${feature}`);
      } else {
        // 老版本 codex 没有 features 子命令，失败也不阻塞流程。
        spawnSync("codex", ["features", "enable", feature], { stdio: "ignore" });
      }
    }
  }

  info("Codex CLI: 同步 skills...");
  runNode("sync-skills.mjs", ["--target=codex"]);

  info("Codex CLI: 注册统一 hooks...");
  runNode("sync-hooks.mjs", ["--target=codex"]);

  info("Codex CLI: 同步插件 MCP...");
  runNode("sync-mcp.mjs", ["--target=codex"]);

  info("Codex CLI: 链接共享记忆...");
  linkMemoryFile("Codex CLI", CODEX_MEMORY_TARGET);

  ok("Codex CLI: done. 重启 codex 生效。");
}

function codexUninstall() {
  info("Codex CLI: 解链 skills...");
  runNode("sync-skills.mjs", ["--target=codex", "--uninstall"]);

  info("Codex CLI: 移除统一 hooks 条目...");
  runNode("sync-hooks.mjs", ["--target=codex", "--uninstall"]);

  info("Codex CLI: 移除插件 MCP...");
  runNode("sync-mcp.mjs", ["--target=codex", "--uninstall"]);

  info("Codex CLI: 移除共享记忆链接...");
  unlinkMemoryFile("Codex CLI", CODEX_MEMORY_TARGET);

  codexLegacyCleanup();

  ok("Codex CLI: uninstalled.");
}

// ── main ─────────────────────────────────────────────────────

// safeStep —— 单端失败不阻塞另一端（claude 出错不挡 codex，反之亦然），
// 但失败必须可见：以前的版本静默 swallow，导致 reinstall 在 install 阶段失败时
// 仍打印 "[ok] done." 且退出码 0，用户拿到假绿色。现在收集错误，main 末尾汇总
// 并把退出码设为 1。两端各跑一次的语义保持不变。
const collectedErrors = [];
function safeStep(label, fn) {
  try { fn(); }
  catch (e) {
    collectedErrors.push({ label, error: e });
    err(`${label}: ${e.message}`);
  }
}

function printHelp() {
  console.log("Usage: node scripts/install.mjs [--install | --uninstall | --reinstall] [--dry-run]");
}

function parseArgs(argv) {
  let action = "install";
  for (const arg of argv) {
    switch (arg) {
      case "--uninstall":
      case "-u":
        action = "uninstall"; break;
      case "--reinstall":
      case "-r":
        action = "reinstall"; break;
      case "install":
      case "--install":
      case "-i":
        action = "install"; break;
      case "--dry-run":
        DRY_RUN = true; break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      case "":
        break;
      default:
        err(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }
  return action;
}

function main() {
  const action = parseArgs(process.argv.slice(2));

  switch (action) {
    case "uninstall":
      if (hasCmd("claude")) safeStep("Claude Code 卸载", claudeUninstall);
      if (hasCmd("codex")) safeStep("Codex CLI 卸载", codexUninstall);
      break;
    case "reinstall":
      if (hasCmd("claude")) safeStep("Claude Code 卸载", claudeUninstall);
      if (hasCmd("codex")) safeStep("Codex CLI 卸载", codexUninstall);
      console.log("");
      if (hasCmd("claude") || hasCmd("codex")) auditSkillEvals();
      if (hasCmd("claude")) safeStep("Claude Code 安装", claudeInstall);
      if (hasCmd("codex")) safeStep("Codex CLI 安装", codexInstall);
      break;
    case "install":
      if (!hasCmd("claude") && !hasCmd("codex")) {
        err("未检测到 'claude' 或 'codex' CLI。请至少安装其中一个：");
        err("  Claude Code: https://code.claude.com");
        err("  Codex CLI:   https://github.com/openai/codex");
        process.exit(1);
      }
      auditSkillEvals();
      if (hasCmd("claude")) safeStep("Claude Code 安装", claudeInstall);
      if (hasCmd("codex")) safeStep("Codex CLI 安装", codexInstall);
      break;
  }

  if (collectedErrors.length > 0) {
    err(`安装过程出现 ${collectedErrors.length} 个失败步骤：`);
    for (const { label } of collectedErrors) err(`  - ${label}`);
    process.exitCode = 1;
  }
}

main();
