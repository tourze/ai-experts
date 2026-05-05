import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { dbSchemaDesignSkill } from "../db-schema-design/index";
import { sqlReviewOptimizationSkill } from "../sql-review-optimization/index";

export const pgsqlRowLevelSecuritySkill = defineSkill({
  id: "pgsql-row-level-security",
  fullName: "PostgreSQL Row-Level Security",
  description: "当用户要实现或审查 PostgreSQL 行级安全策略、多租户隔离或角色权限管理时使用。适用于共享表的数据边界控制。",
  useCases: [
    "多租户 SaaS 共享表存储，需要数据库层面强制租户隔离",
    "按角色（admin / manager / member）限制行级可见范围",
    "连接池共享连接，每次请求通过 `SET LOCAL` 设置会话变量驱动 RLS",
    "需要用 `SET ROLE` 测试策略的正确性",
    "租户列设计参见 `db-schema-design`；索引策略参见 `sql-review-optimization`",
  ],
  constraints: [
    "启用 RLS 后表 owner 默认绕过策略 — 必须加 `FORCE ROW LEVEL SECURITY`",
    "`USING` 控制读（SELECT/UPDATE/DELETE），`WITH CHECK` 控制写（INSERT/UPDATE），两者都要显式声明",
    "`current_setting('app.tenant_id')` 必须在每个事务开始时设置，忘记设置会导致数据泄漏或全拒绝",
    "策略谓词保持简单列比较，避免子查询或复杂函数（每行执行一次影响性能）",
    "RLS 是防御纵深的一层，应用层仍需业务逻辑级权限校验",
  ],
  checklist: [
    "是否同时设置了 `FORCE ROW LEVEL SECURITY`",
    "每个策略是否同时声明了 `USING` 和 `WITH CHECK`",
    "应用是否在获取连接后正确执行 `SET LOCAL app.tenant_id`",
    "策略谓词是否只含简单列比较和 `current_setting()` 调用",
    "是否有自动化测试覆盖正向（看到自己的数据）和反向（不能跨租户读写）",
  ],
  relatedSkills: [
    {
      get id() {
        return sqlReviewOptimizationSkill.id;
      },
      reason: "租户列设计参见 `db-schema-design`；索引策略参见 `sql-review-optimization`。",
    },
    {
      get id() {
        return dbSchemaDesignSkill.id;
      },
      reason: "租户列设计参见 `db-schema-design`；索引策略参见 `sql-review-optimization`",
    },
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
