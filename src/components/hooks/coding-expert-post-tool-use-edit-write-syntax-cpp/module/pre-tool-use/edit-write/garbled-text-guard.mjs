/**
 * 乱码检测 hook（PreToolUse — Edit|Write）
 *
 * 检测 AI 输出中的 Unicode 替换字符（U+FFFD）序列。
 * 这些通常是模型生成了不完整的 Unicode 码点导致的乱码。
 * 在写入前拦截，要求 AI 重新生成干净的内容。
 */

// 连续 2+ 个 U+FFFD 视为乱码
const CONSECUTIVE_PATTERN = /\uFFFD{2,}/g;
// 单独的 U+FFFD（被正常字符包围）
const SCATTERED_PATTERN = /\uFFFD/g;
// 散布阈值：单独 U+FFFD 达到此数量即判定为乱码
const SCATTERED_THRESHOLD = 3;

export async function run(payload) {
  const content =
    payload?.tool_input?.new_string ?? payload?.tool_input?.content;
  if (!content) return null;

  const consecutive = [...content.matchAll(CONSECUTIVE_PATTERN)];
  const scattered = [...content.matchAll(SCATTERED_PATTERN)];

  // 条件：连续 2+ 个 U+FFFD，或散布 3+ 个单独 U+FFFD
  if (consecutive.length === 0 && scattered.length < SCATTERED_THRESHOLD) {
    return null;
  }

  const samples = (consecutive.length > 0 ? consecutive : scattered)
    .slice(0, 3)
    .map((m) => {
      const start = Math.max(0, m.index - 10);
      const end = Math.min(content.length, m.index + m[0].length + 10);
      return `  • "…${content.slice(start, end)}…"`;
    });

  return {
    decision: "block",
    reason: [
      `⛔ 检测到乱码（U+FFFD 替换字符），共 ${scattered.length} 处：`,
      ...samples,
      "",
      "请重新生成干净的内容后再写入，不要包含乱码字符。",
    ].join("\n"),
  };
}
