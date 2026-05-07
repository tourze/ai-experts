import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "需要审查 RLS 谓词、索引命中或策略性能风险时联动。",
    },
    {
      get id() {
        return dbSchemaDesignSkill.id;
      },
      reason: "需要设计租户列、共享表边界或权限表结构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "启用 RLS 但 owner 绕过",
      pass: "同时 FORCE",
    }),
    defineAntiPattern({
      fail: "只 USING 不 WITH CHECK",
      pass: "USING + WITH CHECK 双向",
    }),
    defineAntiPattern({
      fail: "忘记 SET LOCAL",
      pass: "中间件强制设置",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认租户边界、角色模型、表 owner、连接池行为和应用层会话变量设置点。",
      "对目标表同时启用 `ENABLE ROW LEVEL SECURITY` 与 `FORCE ROW LEVEL SECURITY`，避免 owner 绕过策略。",
      "为读写路径分别写清 `USING` 与 `WITH CHECK`，常见租户隔离谓词是 `tenant_id = current_setting('app.tenant_id')::BIGINT`。",
      "每个事务开始时通过中间件设置 `SET LOCAL app.tenant_id`；用 `SET ROLE`、正向/反向样例和索引计划验证隔离与性能。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "RLS 策略 DDL、会话变量合同、角色/租户权限矩阵和 owner 绕过处理。",
      "正向可见、跨租户拒绝、写入 `WITH CHECK` 拒绝和缺失 `tenant_id` 的测试结果。",
      "RLS 谓词索引需求、性能风险和需要读取 code-patterns reference 的具体实现点。",
    ],
  }),
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "PostgreSQL 行级安全策略的代码模式示例，包括多租户隔离、角色权限和测试脚本。",
      loadWhen: "需要参考具体的 RLS 策略实现代码或编写测试验证数据隔离时读取。",
    }),
  ],
});
