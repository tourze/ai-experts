import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pgsqlRowLevelSecuritySkill = defineSkill({
  id: "pgsql-row-level-security",
  fullName: "PostgreSQL Row-Level Security",
  description: "当用户要实现或审查 PostgreSQL 行级安全策略、多租户隔离或角色权限管理时使用。适用于共享表的数据边界控制。",
  useCases: [
    "多租户 SaaS 共享表存储，需要数据库层面强制租户隔离",
    "按角色（admin / manager / member）限制行级可见范围",
    "连接池共享连接，每次请求通过 `SET LOCAL` 设置会话变量驱动 RLS",
    "需要用 `SET ROLE` 测试策略的正确性",
    "租户列设计参见 [db-schema-design](../db-schema-design/SKILL.md)；索引策略参见 [sql-review-optimization](../sql-review-optimization/SKILL.md)",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Reference material for pgsql-row-level-security.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
