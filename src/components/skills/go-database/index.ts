import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goDatabaseSkill = defineSkill({
  id: "go-database",
  fullName: "go-database",
  description: "当 Go 代码涉及 SQL 查询、事务、连接池、NULLable 列扫描、migration 或数据库访问层设计时使用。",
  useCases: [
    "编写 SQL 查询、事务块、连接池配置或数据库 migration 脚本。",
    "选择扫描方式（`database/sql` 手动 Scan / sqlx / sqlc）或处理 NULLable 列。",
    "设计 Repository 接口、实现 batch insert、乐观锁、读写分离。",
    "排查连接泄漏、事务未提交/回滚、查询超时不生效等问题。",
    "SQL 注入防护详见 [go-security](../go-security/SKILL.md)；查询取消传播详见 [go-context-lifecycle](../go-concurrency-patterns/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "transactions",
      source: new URL("./references/transactions.md", import.meta.url),
      target: "references/transactions.md",
      title: "transactions.md",
      summary: "Reference material for go-database.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
