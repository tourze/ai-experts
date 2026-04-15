/**
 * 破坏性文件系统命令拦截 hook（PreToolUse — Bash）
 *
 * 只拦截语言无关的通用危险操作（rm -rf 等）。
 * Git 破坏性命令由 git-expert 负责，SQL 破坏性命令由 database-expert 负责。
 */

const DANGEROUS_PATTERNS = [
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+[\/~]/, "rm -r[f] 根路径或家目录极其危险"],
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+\.\/?(\s|$|;|&|\|)/, "rm -r . 会删除当前目录所有内容"],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  for (const [pattern, reason] of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `[Dangerous Command] 已拦截高危命令\n\n原因：${reason}\n命令：${command}\n\n如确需执行，请先得到用户明确授权。`,
      };
    }
  }
  return null;
}
