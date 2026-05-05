import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goSecuritySkill } from "../go-security/index";

export const goDatabaseSkill = defineSkill({
  id: "go-database",
  fullName: "go-database",
  description: "当 Go 代码涉及 SQL 查询、事务、连接池、NULLable 列扫描、migration 或数据库访问层设计时使用。",
  useCases: [
    "编写 SQL 查询、事务块、连接池配置或数据库 migration 脚本。",
    "选择扫描方式（`database/sql` 手动 Scan / sqlx / sqlc）或处理 NULLable 列。",
    "设计 Repository 接口、实现 batch insert、乐观锁、读写分离。",
    "排查连接泄漏、事务未提交/回滚、查询超时不生效等问题。",
    "SQL 注入防护详见 `go-security`；查询取消传播详见 `go-context-lifecycle`。",
  ],
  constraints: [
    "参数化查询：必须用 `?` 占位符，禁止字符串拼接 SQL。安全性细节见 go-security。",
    "Context 传播：所有数据库操作使用 `QueryContext`、`QueryRowContext`、`ExecContext`，不使用无 Context 版本。",
    "事务模式：`db.BeginTx(ctx, nil)` + `defer tx.Rollback()` + 显式 `tx.Commit()`。",
    "NULLable 列：使用 `sql.NullString` / `sql.NullInt64` 或指针类型 `*string` / `*int64` 接收。",
    "连接池：上线前必须配置 `SetMaxOpenConns`、`SetMaxIdleConns`、`SetConnMaxLifetime`。",
    "ORM 约束：复杂查询（多表 JOIN、子查询、窗口函数）不用 ORM，使用 query builder 或 raw SQL。",
    "Migration：使用 golang-migrate、goose 或 atlas（声明式），禁止手动 DDL 部署。",
  ],
  relatedSkills: [
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      label: "go-context-lifecycle",
      reason: "SQL 注入防护详见 `go-security`；查询取消传播详见 `go-context-lifecycle`。",
    },
    {
      get id() {
        return goSecuritySkill.id;
      },
      reason: "SQL 注入防护详见 `go-security`；查询取消传播详见 `go-context-lifecycle`。",
    },
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
