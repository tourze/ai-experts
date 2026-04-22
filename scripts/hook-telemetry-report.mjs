#!/usr/bin/env node
/**
 * Hook 遥测分析报告。
 *
 * 默认读取当前工作区对应的
 * ~/.claude/hook-telemetry/workspaces/<hash>-<name>/decisions.jsonl*，
 * 输出各插件 hook 的 block/report/context/error/skip/audit 频次、热点文件/命令和可疑误拦信号。
 *
 * 用法：
 *   node scripts/hook-telemetry-report.mjs              # 默认最近 7 天
 *   node scripts/hook-telemetry-report.mjs --days 30    # 最近 30 天
 *   node scripts/hook-telemetry-report.mjs --plugin git-expert
 *   node scripts/hook-telemetry-report.mjs --all-workspaces
 *   node scripts/hook-telemetry-report.mjs --session latest
 *   node scripts/hook-telemetry-report.mjs --purge 90   # 清理 90 天前的记录
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { homedir } from "node:os";

const TELEMETRY_ROOT = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR ||
  join(homedir(), ".claude", "hook-telemetry");
const EXPLICIT_TELEMETRY_FILE = process.env.AI_EXPERTS_HOOK_TELEMETRY_FILE || null;
const DECISIONS = ["block", "report", "context", "error", "skip", "audit"];

function parseArgs(argv) {
  const args = {
    allWorkspaces: false,
    days: 7,
    purge: null,
    plugin: null,
    session: null,
    telemetryFile: EXPLICIT_TELEMETRY_FILE,
    workspace: process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE || process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all-workspaces") {
      args.allWorkspaces = true;
      continue;
    }
    if (arg === "--days") {
      args.days = Number.parseInt(argv[index + 1] ?? "", 10);
      index += 1;
      continue;
    }
    if (arg === "--purge") {
      args.purge = Number.parseInt(argv[index + 1] ?? "", 10);
      index += 1;
      continue;
    }
    if (arg === "--plugin") {
      args.plugin = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--session") {
      args.session = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--telemetry-file") {
      args.telemetryFile = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg === "--workspace") {
      args.workspace = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.days) || args.days <= 0) {
    throw new Error("--days must be a positive integer");
  }
  if (args.purge !== null && (!Number.isFinite(args.purge) || args.purge <= 0)) {
    throw new Error("--purge must be a positive integer");
  }
  if (args.session !== null && args.session.trim() === "") {
    throw new Error("--session must be a non-empty session id, transcript path, or latest");
  }
  return args;
}

function workspaceBucketDir(workspacePath) {
  const resolved = resolve(workspacePath);
  const hash = createHash("sha256").update(resolved).digest("hex").slice(0, 12);
  const rawName = basename(resolved) || "workspace";
  const slug = rawName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 48) || "workspace";
  return join(TELEMETRY_ROOT, "workspaces", `${hash}-${slug}`);
}

function telemetryFilesInDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => /^decisions\.jsonl(?:\.\d+)?$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => join(dir, name));
}

function allWorkspaceTelemetryFiles() {
  const workspacesRoot = join(TELEMETRY_ROOT, "workspaces");
  if (!existsSync(workspacesRoot) || !statSync(workspacesRoot).isDirectory()) {
    return [];
  }
  return readdirSync(workspacesRoot)
    .map((name) => join(workspacesRoot, name))
    .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
    .flatMap((dir) => telemetryFilesInDir(dir));
}

function telemetrySources(args) {
  if (args.telemetryFile) {
    return {
      description: args.telemetryFile,
      files: existsSync(args.telemetryFile) ? [args.telemetryFile] : [],
    };
  }

  if (args.allWorkspaces) {
    return {
      description: `${join(TELEMETRY_ROOT, "workspaces", "*/decisions.jsonl*")}`,
      files: allWorkspaceTelemetryFiles(),
    };
  }

  const dir = workspaceBucketDir(args.workspace);
  return {
    description: `${dir}/decisions.jsonl*`,
    files: telemetryFilesInDir(dir),
  };
}

function readEntries(files) {
  if (files.length === 0) {
    return null;
  }

  const entries = [];
  for (const file of files) {
    const raw = readFileSync(file, "utf-8").trim();
    if (!raw) {
      continue;
    }
    entries.push(
      ...raw
        .split("\n")
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    );
  }
  return entries;
}

function emptyStats() {
  return {
    block: 0,
    report: 0,
    context: 0,
    error: 0,
    skip: 0,
    audit: 0,
    files: new Map(),
    durations: [],
  };
}

function shortTarget(value) {
  if (!value) {
    return "-";
  }
  const base = String(value).split("/").pop();
  return base.length > 32 ? `${base.slice(0, 29)}...` : base;
}

function average(values) {
  if (values.length === 0) {
    return "-";
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return `${(total / values.length).toFixed(1)}ms`;
}

function cell(value, width) {
  const text = String(value);
  if (text.length <= width) {
    return text.padEnd(width);
  }
  if (width <= 3) {
    return text.slice(0, width);
  }
  return `${text.slice(0, width - 3)}...`;
}

function sessionKey(entry) {
  return entry.session_id || entry.transcript_path || null;
}

function applySessionFilter(entries, session) {
  if (!session) {
    return { entries, label: null };
  }

  if (session === "latest") {
    const latest = [...entries]
      .filter((entry) => sessionKey(entry))
      .sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))[0];
    const key = latest ? sessionKey(latest) : null;
    return {
      entries: key ? entries.filter((entry) => sessionKey(entry) === key) : [],
      label: key || "latest (no session_id/transcript_path found)",
    };
  }

  return {
    entries: entries.filter((entry) => entry.session_id === session || entry.transcript_path === session),
    label: session,
  };
}

function printReport(entries, args, sourceDescription) {
  const stats = new Map();
  for (const entry of entries) {
    const key = `${entry.plugin ?? "(unknown)"}/${entry.hook ?? "(unknown)"}`;
    if (!stats.has(key)) {
      stats.set(key, emptyStats());
    }

    const item = stats.get(key);
    if (DECISIONS.includes(entry.decision)) {
      item[entry.decision] += 1;
    }
    if (entry.file) {
      item.files.set(entry.file, (item.files.get(entry.file) ?? 0) + 1);
    }
    if (typeof entry.duration_ms === "number") {
      item.durations.push(entry.duration_ms);
    }
  }

  const fpSuspects = [];
  for (const [hook, item] of stats.entries()) {
    for (const [file, count] of item.files) {
      if (count >= 3 && item.block > 0) {
        fpSuspects.push({ hook, file, count });
      }
    }
  }

  console.log(`\n${"=".repeat(72)}`);
  console.log(`  Hook Telemetry Report - 最近 ${args.days} 天（${entries.length} 条记录）`);
  if (args.session) {
    console.log(`  Session: ${args.session}`);
  }
  console.log(`${"=".repeat(72)}\n`);

  console.log(
    "  Hook".padEnd(39) +
    "Block".padEnd(8) +
    "Report".padEnd(8) +
    "Ctx".padEnd(6) +
    "Err".padEnd(6) +
    "Skip".padEnd(7) +
    "Audit".padEnd(8) +
    "Avg".padEnd(9) +
    "Hot Target",
  );
  console.log(`  ${"-".repeat(68)}`);

  const sorted = [...stats.entries()].sort((a, b) =>
    (b[1].block + b[1].report + b[1].error) - (a[1].block + a[1].report + a[1].error),
  );

  for (const [hook, item] of sorted) {
    const hotTarget = [...item.files.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map(([file, count]) => `${shortTarget(file)}(${count})`)
      .join(", ") || "-";

    console.log(
      `  ${cell(hook, 36)} ` +
      `${String(item.block).padEnd(8)}` +
      `${String(item.report).padEnd(8)}` +
      `${String(item.context).padEnd(6)}` +
      `${String(item.error).padEnd(6)}` +
      `${String(item.skip).padEnd(7)}` +
      `${String(item.audit).padEnd(8)}` +
      `${average(item.durations).padEnd(9)}` +
      hotTarget,
    );
  }

  if (fpSuspects.length > 0) {
    console.log(`\n${"-".repeat(72)}`);
    console.log("  FP 可疑信号（同目标被同一 hook 命中 >= 3 次）\n");
    for (const { hook, file, count } of fpSuspects.sort((a, b) => b.count - a.count).slice(0, 10)) {
      console.log(`  ${hook.padEnd(36)} ${shortTarget(file)} (${count})`);
    }
  }

  console.log(`\n${"=".repeat(72)}`);
  console.log(`  日志位置：${sourceDescription}`);
  console.log("  skip 默认自动记录；降噪：AI_EXPERTS_HOOK_AUDIT=0");
  console.log("  关闭遥测：AI_EXPERTS_HOOK_TELEMETRY=0");
  console.log("  单桶上限：AI_EXPERTS_HOOK_TELEMETRY_MAX_BYTES / AI_EXPERTS_HOOK_TELEMETRY_MAX_FILES");
  console.log(`  清理旧数据：node scripts/hook-telemetry-report.mjs --purge 90`);
  console.log(`${"=".repeat(72)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = telemetrySources(args);
  const allEntries = readEntries(sources.files);

  if (allEntries === null) {
    console.log("暂无遥测数据。");
    console.log(`日志位置：${sources.description}`);
    return;
  }

  if (args.purge) {
    const cutoff = Date.now() - args.purge * 86400000;
    let removed = 0;
    let keptCount = 0;
    for (const file of sources.files) {
      const entries = readEntries([file]) ?? [];
      const kept = entries.filter((entry) => entry.ts >= cutoff);
      removed += entries.length - kept.length;
      keptCount += kept.length;
      writeFileSync(
        file,
        kept.map((entry) => JSON.stringify(entry)).join("\n") + (kept.length ? "\n" : ""),
        "utf-8",
      );
    }
    console.log(`已清理 ${removed} 条记录（${args.purge} 天前），保留 ${keptCount} 条。`);
    return;
  }

  const cutoff = Date.now() - args.days * 86400000;
  const entries = allEntries
    .filter((entry) => entry.ts >= cutoff)
    .filter((entry) => !args.plugin || entry.plugin === args.plugin);
  const sessionFiltered = applySessionFilter(entries, args.session);

  if (sessionFiltered.entries.length === 0) {
    console.log(`最近 ${args.days} 天没有遥测记录。共 ${allEntries.length} 条历史记录。`);
    if (sessionFiltered.label) {
      console.log(`Session：${sessionFiltered.label}`);
    }
    return;
  }

  printReport(sessionFiltered.entries, args, sources.description);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
