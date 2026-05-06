import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

export const catWriteGuardHook = defineHook({
  id: "cat-write-guard",
  description: "拦截 cat heredoc 写文件，防止绕过 PostToolUse 检查链。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./cat-write-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * cat heredoc 写文件拦截 hook（PreToolUse — Bash）
 *
 * 检测通过 `cat > file << 'EOF'` 或 `cat << 'EOF' > file` 写文件的行为。
 * 这种方式绕过了所有 PostToolUse Edit/Write hook（语法检查、文件预算、
 * 编码守卫等全部失效），同时超长命令浪费大量 token。
 *
 * 证据：历史日志中 125 次 cat heredoc 写文件，最长 27287 字符。
 */

// 匹配模式：
// 1. cat > file << 'EOF'     — 先重定向后 heredoc
// 2. cat << 'EOF' > file     — 先 heredoc 后重定向
// 3. cat >> file << 'EOF'    — 追加模式
//
// 排除：
// - cat << EOF | command     — 管道输入，不是写文件
// - echo "..." > file        — 短重定向，不属于本 hook 的拦截目标
const CAT_HEREDOC_WRITE_RE =
  /\bcat\s*(?:>|>>)\s*\S+[^|]*<<|cat\s*<<-?\s*['"]?\w+['"]?\s*(?:>|>>)\s*\S+/;

// 检测目标路径是否在 /tmp 下
function isInTmp(command: string) {
  // 提取 > 或 >> 后的路径
  const match = command.match(
    /(?:>|>>)\s*(\/tmp\/\S+|\/private\/tmp\/\S+|\$TMPDIR\/\S+)/
  );
  return !!match;
}

// 检测是否是管道输入模式（cat << EOF | command），不是写文件
function isPipeInput(command: string) {
  // heredoc 后面紧跟 | 表示管道
  return /<<-?\s*['"]?\w+['"]?\s*\|/.test(command);
}

export async function run(payload: LegacyHookPayload) {
  const command = payload?.tool_input?.command || "";

  if (!CAT_HEREDOC_WRITE_RE.test(command)) return null;

  // 管道输入不拦截
  if (isPipeInput(command)) return null;

  // /tmp 下的文件只 report，不 block
  if (isInTmp(command)) {
    return {
      decision: "report",
      reason: [
        "[Cat Write Guard] 检测到 cat heredoc 写入 /tmp 文件",
        "",
        "通过 Bash cat heredoc 写文件会绕过所有 PostToolUse hook",
        "（语法检查、文件预算、编码守卫等均不生效）。",
        "如果是临时脚本可以接受，但建议优先使用 Write 工具。",
      ].join("\n"),
    };
  }

  return {
    decision: "block",
    reason: [
      "[Cat Write Guard] 已拦截 cat heredoc 写文件",
      "",
      "通过 Bash 的 cat heredoc 写文件会绕过所有 PostToolUse hook：",
      "  • 语法检查器不会执行",
      "  • markdown-budget-guard 不会检查 token 预算",
      "  • encoding-guard 不会检查编码",
      "  • merge-conflict-guard 不会检查冲突标记",
      "",
      "替代方案：",
      "  • 新建文件 → 使用 Write 工具",
      "  • 修改文件 → 使用 Edit 工具",
      "  • 写入 /tmp 临时文件 → 可改用 Write 工具或接受此提醒后继续",
    ].join("\n"),
  };
}
