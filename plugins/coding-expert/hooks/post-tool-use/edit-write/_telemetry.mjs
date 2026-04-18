/**
 * Hook 决策遥测记录模块（内部工具，_ 前缀不会被 dispatch 加载为 hook）
 *
 * 每次 guard 产生 block/report 决策时记录一条 JSONL 日志，
 * 供 scripts/hook-telemetry-report.mjs 分析 FP 率和阈值建议。
 *
 * 日志路径：~/.claude/hook-telemetry/decisions.jsonl
 * 格式：每行一条 JSON，字段见 record() 函数签名。
 *
 * 设计原则：
 *   - 写入失败静默降级，绝不阻塞正常 hook 流程
 *   - 单文件 append，无需外部依赖
 *   - 日志文件由分析脚本按 maxAge 自动清理
 */

import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const TELEMETRY_DIR = join(homedir(), ".claude", "hook-telemetry");
const TELEMETRY_FILE = join(TELEMETRY_DIR, "decisions.jsonl");

/**
 * 记录一条 hook 决策。
 *
 * @param {object} opts
 * @param {string} opts.hook     - hook 文件名（如 "file-budget-guard.mjs"）
 * @param {string} opts.event    - hook 事件路径（如 "post-tool-use/edit-write"）
 * @param {string} opts.decision - "block" | "report"
 * @param {string} [opts.file]   - 涉及的文件路径（PostToolUse）或命令摘要（PreToolUse）
 * @param {string} [opts.detail] - 决策原因摘要（截断到 200 字符）
 */
export function record({ hook, event, decision, file, detail }) {
  try {
    if (!existsSync(TELEMETRY_DIR)) {
      mkdirSync(TELEMETRY_DIR, { recursive: true });
    }
    const entry = {
      ts: Date.now(),
      hook,
      event,
      decision,
      file: file || null,
      detail: detail ? detail.slice(0, 200) : null,
    };
    appendFileSync(TELEMETRY_FILE, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // 静默 — telemetry 失败不应影响 hook 正常工作
  }
}
