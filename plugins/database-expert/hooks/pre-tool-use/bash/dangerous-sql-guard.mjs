/**
 * 破坏性 SQL 命令拦截 hook（PreToolUse — Bash）
 *
 * 拦截通过 Bash 执行的 DROP DATABASE/TABLE/SCHEMA 和 TRUNCATE TABLE。
 * 规则在 PATTERNS 中集中管理，新增规则只需加一行。
 */

const PATTERNS = [
  [/\bDROP\s+(DATABASE|TABLE|SCHEMA)\b/i, "DROP DATABASE/TABLE/SCHEMA 会永久删除数据"],
  [/\bTRUNCATE\s+TABLE\b/i, "TRUNCATE TABLE 会清空表数据且不可回滚"],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  for (const [pattern, reason] of PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `[Dangerous SQL] 已拦截高危命令\n\n原因：${reason}\n命令：${command}\n\n如确需执行，请先得到用户明确授权。`,
      };
    }
  }
  return null;
}
