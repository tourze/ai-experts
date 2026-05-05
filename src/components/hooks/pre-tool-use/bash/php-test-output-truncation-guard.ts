import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpTestOutputTruncationGuardHook = defineHook({
  id: "php-test-output-truncation-guard",
  description: "检测 PHP 测试命令输出被 tail/head 截断，防止关键错误信息丢失。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./php-test-output-truncation-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 测试输出截断拦截 hook（PreToolUse — Bash）
 * PHP hook extracted PHP 专用版本。
 *
 * 检测 phpunit/phpstan/pest/psalm 命令的输出被 | tail / | head 截断的模式。
 * 截断会导致关键错误信息丢失 → agent 盲猜修复 → 反复执行。
 */

// 重量级命令关键词（仅 PHP，正则片段，用于构造匹配）
const HEAVY_COMMANDS = ["phpunit", "phpstan", "pest", "psalm"];

const HEAVY_RE = new RegExp(`\\b(?:${HEAVY_COMMANDS.join("|")})\\b`);

// 截断模式：| tail -N / | head -N（末尾位置）
// 排除 | tail -1（常用于只取 exit code 的合理场景）
const TRUNCATION_RE = /\|\s*(?:tail|head)\s+-(?:n\s*)?(\d+)\s*$/;

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 不含重量级命令 → 跳过
  if (!HEAVY_RE.test(command)) return null;

  const match = command.match(TRUNCATION_RE);
  if (!match) return null;

  const lines = parseInt(match[1], 10);
  // tail -1 / head -1 常用于取单行摘要，保留
  if (lines === 1) return null;

  return {
    decision: "report",
    reason: [
      `[Test Truncation] 测试/编译输出被 | tail/head -${lines} 截断`,
      "",
      "截断输出会丢失关键错误信息，导致盲猜修复循环。建议：",
      "  • 直接查看完整输出（大多数测试输出 < 200 行）",
      "  • 如输出过长，先 tee /tmp/test-output.log 保存，再按需 grep",
      "  • 用 grep -E 'FAIL|ERROR|error\\[' 精确过滤关键信息",
    ].join("\n"),
  };
}
