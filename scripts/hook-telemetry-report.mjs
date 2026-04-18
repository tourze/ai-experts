#!/usr/bin/env node
/**
 * Hook 遥测分析报告
 *
 * 读取 ~/.claude/hook-telemetry/decisions.jsonl，输出：
 *   1. 各 guard 的 block/report 频次统计
 *   2. FP 可疑信号检测（同文件短时间内被反复 block → 可能是误拦）
 *   3. 阈值调优建议
 *
 * 用法：
 *   node scripts/hook-telemetry-report.mjs              # 默认最近 7 天
 *   node scripts/hook-telemetry-report.mjs --days 30    # 最近 30 天
 *   node scripts/hook-telemetry-report.mjs --purge 90   # 清理 90 天前的记录
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const TELEMETRY_FILE = join(homedir(), ".claude", "hook-telemetry", "decisions.jsonl");

// ── 参数解析 ──────────────────────────────────────────────
const args = process.argv.slice(2);
let days = 7;
let purge = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--days" && args[i + 1]) days = parseInt(args[i + 1], 10);
  if (args[i] === "--purge" && args[i + 1]) purge = parseInt(args[i + 1], 10);
}

// ── 读取日志 ──────────────────────────────────────────────
if (!existsSync(TELEMETRY_FILE)) {
  console.log("📭 暂无遥测数据。");
  console.log(`   日志位置：${TELEMETRY_FILE}`);
  console.log("   安装 coding-expert 插件后，hook 决策会自动记录到此文件。");
  process.exit(0);
}

const raw = readFileSync(TELEMETRY_FILE, "utf-8").trim();
if (!raw) {
  console.log("📭 遥测文件为空。");
  process.exit(0);
}

const allEntries = raw.split("\n").map((line) => {
  try { return JSON.parse(line); } catch { return null; }
}).filter(Boolean);

// ── 清理旧记录 ───────────────────────────────────────────
if (purge) {
  const cutoff = Date.now() - purge * 86400000;
  const kept = allEntries.filter((e) => e.ts >= cutoff);
  const removed = allEntries.length - kept.length;
  writeFileSync(
    TELEMETRY_FILE,
    kept.map((e) => JSON.stringify(e)).join("\n") + (kept.length ? "\n" : ""),
    "utf-8",
  );
  console.log(`🧹 已清理 ${removed} 条记录（${purge} 天前），保留 ${kept.length} 条。`);
  process.exit(0);
}

// ── 过滤时间范围 ─────────────────────────────────────────
const cutoff = Date.now() - days * 86400000;
const entries = allEntries.filter((e) => e.ts >= cutoff);

if (entries.length === 0) {
  console.log(`📭 最近 ${days} 天没有遥测记录。共 ${allEntries.length} 条历史记录。`);
  process.exit(0);
}

// ── 统计 ─────────────────────────────────────────────────
const stats = {};
for (const e of entries) {
  if (!stats[e.hook]) stats[e.hook] = { block: 0, report: 0, files: new Map() };
  const s = stats[e.hook];
  if (e.decision === "block") s.block++;
  if (e.decision === "report") s.report++;
  // 追踪文件级别的命中频次
  if (e.file) {
    const count = s.files.get(e.file) || 0;
    s.files.set(e.file, count + 1);
  }
}

// ── FP 可疑检测 ──────────────────────────────────────────
// 启发式：同一 guard 对同一文件 block ≥ 3 次 → 可能是误拦或阈值过严
const fpSuspects = [];
for (const [hook, s] of Object.entries(stats)) {
  for (const [file, count] of s.files) {
    if (count >= 3) {
      fpSuspects.push({ hook, file, count });
    }
  }
}

// ── 阈值建议 ─────────────────────────────────────────────
const suggestions = [];

// file-budget-guard: 如果 block 率很高，可能阈值过严
const fbg = stats["file-budget-guard.mjs"];
if (fbg && fbg.block > 10) {
  // 从 detail 中提取超出行数的分布
  const overages = entries
    .filter((e) => e.hook === "file-budget-guard.mjs" && e.decision === "block" && e.detail)
    .map((e) => {
      const m = e.detail.match(/当前: (\d+) 行 \| 预算: (\d+) 行/);
      if (!m) return null;
      return { current: parseInt(m[1], 10), budget: parseInt(m[2], 10) };
    })
    .filter(Boolean);

  if (overages.length > 0) {
    const within10pct = overages.filter((o) => o.current <= o.budget * 1.1).length;
    const ratio = within10pct / overages.length;
    if (ratio > 0.5) {
      suggestions.push(
        `file-budget-guard: ${Math.round(ratio * 100)}% 的 block 超出预算不到 10%，` +
        `建议适当放宽相关扩展名的预算值`,
      );
    }
  }
}

// edit-loop-detector: 如果 warn(report) 很多但 block 很少 → 阈值合理
const eld = stats["edit-loop-detector.mjs"];
if (eld && eld.report > 20 && eld.block < 3) {
  suggestions.push(
    `edit-loop-detector: report ${eld.report} 次但只 block ${eld.block} 次，` +
    `说明警告有效，阈值合理`,
  );
}

// error-retry-guard: 如果 block 很多 → 可能需要扩大只读命令白名单
const erg = stats["error-retry-guard.mjs"];
if (erg && erg.block > 5) {
  const repeatedCmds = entries
    .filter((e) => e.hook === "error-retry-guard.mjs" && e.decision === "block" && e.file)
    .map((e) => e.file.split(" ")[0]) // 取命令名
    .reduce((acc, cmd) => { acc[cmd] = (acc[cmd] || 0) + 1; return acc; }, {});

  const topCmd = Object.entries(repeatedCmds).sort((a, b) => b[1] - a[1])[0];
  if (topCmd) {
    suggestions.push(
      `error-retry-guard: 最常被拦截的命令前缀是 "${topCmd[0]}"（${topCmd[1]} 次），` +
      `如果是合理的重复操作，考虑加入只读白名单`,
    );
  }
}

// ── 输出报告 ──────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`  Hook Telemetry Report — 最近 ${days} 天（共 ${entries.length} 条记录）`);
console.log(`${"═".repeat(60)}\n`);

// 按 block 数降序排列
const sorted = Object.entries(stats).sort((a, b) => b[1].block - a[1].block);

console.log("  Guard".padEnd(40) + "Block".padEnd(8) + "Report".padEnd(10) + "Hot Files");
console.log("  " + "─".repeat(56));

for (const [hook, s] of sorted) {
  const total = s.block + s.report;
  const hotFiles = [...s.files.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([f, c]) => `${f.split("/").pop()}(×${c})`)
    .join(", ");

  console.log(
    `  ${hook.replace(".mjs", "").padEnd(38)}${String(s.block).padEnd(8)}${String(s.report).padEnd(10)}${hotFiles || "-"}`,
  );
}

if (fpSuspects.length > 0) {
  console.log(`\n${"─".repeat(60)}`);
  console.log("  ⚠️  FP 可疑信号（同文件被同一 guard 命中 ≥ 3 次）\n");
  for (const { hook, file, count } of fpSuspects.sort((a, b) => b.count - a.count).slice(0, 10)) {
    const shortFile = file.length > 50 ? "..." + file.slice(-47) : file;
    console.log(`  ${hook.replace(".mjs", "").padEnd(30)} ${shortFile} (×${count})`);
  }
}

if (suggestions.length > 0) {
  console.log(`\n${"─".repeat(60)}`);
  console.log("  📊 阈值调优建议\n");
  for (const s of suggestions) {
    console.log(`  → ${s}`);
  }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  日志位置：${TELEMETRY_FILE}`);
console.log(`  清理旧数据：node scripts/hook-telemetry-report.mjs --purge 90`);
console.log(`${"═".repeat(60)}\n`);
