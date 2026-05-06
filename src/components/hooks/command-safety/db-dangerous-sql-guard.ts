import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

export const dbDangerousSqlGuardHook = defineHook({
  id: "db-dangerous-sql-guard",
  description: "拦截 DROP、TRUNCATE、无 WHERE 的 DELETE 等破坏性 SQL 命令。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./db-dangerous-sql-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 破坏性 SQL 命令拦截 hook（PreToolUse — Bash）
 *
 * 拦截通过 Bash 执行的高危 SQL 操作：
 *   - DROP DATABASE / TABLE / SCHEMA / INDEX / VIEW
 *   - TRUNCATE TABLE
 *   - DELETE / UPDATE without WHERE（全表扫描）
 *   - ALTER TABLE … DROP COLUMN
 *   - GRANT / REVOKE（权限变更）
 *
 * 检测逻辑：先把 command 中的引号字符串和注释剥离，再用正则匹配，
 * 避免字符串字面量里的关键词误触。
 * 规则在 BLOCK_RULES / REPORT_RULES 中集中管理，新增规则只需加一行。
 */

// ── 辅助：剥离 SQL 字符串值和注释 ──
// 注意：只剥离单引号字符串（SQL 值），保留双引号内容（shell 参数 / SQL 标识符），
// 因为 Bash 命令中 SQL 通常包裹在双引号里，如 mysql -e "DROP TABLE users"。
function stripLiterals(sql: string) {
  return sql
    .replace(/'[^']*'/g, "''")        // 单引号字符串值
    .replace(/--[^\n]*/g, "")         // 行注释
    .replace(/\/\*[\s\S]*?\*\//g, "") // 块注释
    .replace(/\\n/g, " ");            // shell 中的 \n 换成空格
}

// ── 检测 DELETE / UPDATE 是否缺少 WHERE ──
// 匹配 DELETE FROM … 或 UPDATE … SET … 后面没有 WHERE
// 只看第一条语句（分号截断），降低误判
function hasDeleteWithoutWhere(sql: string) {
  const stmts = sql.split(";");
  for (const raw of stmts) {
    const s = raw.trim();
    if (/\bDELETE\s+FROM\b/i.test(s) && !/\bWHERE\b/i.test(s)) return true;
  }
  return false;
}

function hasUpdateWithoutWhere(sql: string) {
  const stmts = sql.split(";");
  for (const raw of stmts) {
    const s = raw.trim();
    if (/\bUPDATE\b/i.test(s) && /\bSET\b/i.test(s) && !/\bWHERE\b/i.test(s)) return true;
  }
  return false;
}

// ── Block：必须拦截 ──
const BLOCK_RULES: readonly (readonly [RegExp, string])[] = [
  [/\bDROP\s+(DATABASE|TABLE|SCHEMA)\b/i,  "DROP DATABASE/TABLE/SCHEMA 会永久删除数据"],
  [/\bDROP\s+(INDEX|VIEW)\b/i,             "DROP INDEX/VIEW 会删除索引或视图定义"],
  [/\bTRUNCATE\s+(TABLE\s+)?\w/i,          "TRUNCATE 会清空表数据且不可回滚"],
  [/\bALTER\s+TABLE\b[^;]*\bDROP\s+COLUMN\b/i, "ALTER TABLE … DROP COLUMN 会永久删除列及其数据"],
];

// ── Report：警告但不阻断 ──
const REPORT_RULES: readonly (readonly [RegExp, string])[] = [
  [/\bGRANT\b/i,  "GRANT 会变更数据库权限，请确认目标用户和权限范围"],
  [/\bREVOKE\b/i, "REVOKE 会撤销数据库权限，请确认影响范围"],
];

export async function run(payload: LegacyHookPayload) {
  const command = payload?.tool_input?.command || "";
  const cleaned = stripLiterals(command);

  // 1. Block 级规则
  for (const [pattern, reason] of BLOCK_RULES) {
    if (pattern.test(cleaned)) {
      return {
        decision: "block",
        reason: `[Dangerous SQL] 已拦截高危命令\n\n原因：${reason}\n命令：${command}\n\n如确需执行，请先得到用户明确授权。`,
      };
    }
  }

  // 2. DELETE / UPDATE without WHERE → block
  if (hasDeleteWithoutWhere(cleaned)) {
    return {
      decision: "block",
      reason: `[Dangerous SQL] 已拦截高危命令\n\n原因：DELETE 缺少 WHERE 子句，将删除全表数据\n命令：${command}\n\n如确需清空表，请使用 TRUNCATE 或添加 WHERE 条件。`,
    };
  }
  if (hasUpdateWithoutWhere(cleaned)) {
    return {
      decision: "block",
      reason: `[Dangerous SQL] 已拦截高危命令\n\n原因：UPDATE 缺少 WHERE 子句，将修改全表数据\n命令：${command}\n\n请添加 WHERE 条件限定更新范围。`,
    };
  }

  // 3. Report 级规则
  for (const [pattern, reason] of REPORT_RULES) {
    if (pattern.test(cleaned)) {
      return {
        decision: "report",
        reason: `[SQL Notice] ${reason}\n命令：${command}`,
      };
    }
  }

  return null;
}
