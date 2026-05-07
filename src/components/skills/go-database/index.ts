import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "字符串拼接 SQL。",
      pass: "用 `?` 占位符 + 参数化查询。",
    }),
    defineAntiPattern({
      fail: "使用 db.Query() / db.Exec() 无 Context 版本。",
      pass: "改用 QueryContext / ExecContext。",
    }),
    defineAntiPattern({
      fail: "事务中忘记 defer tx.Rollback()。",
      pass: "Begin 后立即 defer Rollback，Commit 成功后 Rollback 为 no-op。",
    }),
    defineAntiPattern({
      fail: "NULL 列直接 Scan 到值类型。",
      pass: "使用 sql.NullString 或指针 *string。",
    }),
    defineAntiPattern({
      fail: "忽略 sql.ErrNoRows。",
      pass: `业务语义区分"不存在"与"查询失败"。`,
    }),
    defineAntiPattern({
      fail: "连接池未配置导致连接耗尽。",
      pass: "上线前设置 MaxOpenConns / MaxIdleConns / ConnMaxLifetime。",
    }),
    defineAntiPattern({
      fail: "ORM 处理复杂查询产生 N+1。",
      pass: "改用 raw SQL 或 query builder。",
    }),
    defineAntiPattern({
      fail: "Migration 手动执行 DDL。",
      pass: "使用 golang-migrate / goose 版本化管理。",
    }),
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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计 Go 数据访问层、Repository 接口、NULL 扫描、连接池参数、事务边界和 SQL 错误处理。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 DB driver、上下文超时、事务范围、NULL 字段、连接池负载和测试替身。",
      "用 Repository 隐藏数据访问，接口放消费方或业务边界，错误保留 `%w` 链。",
      "NULLable 字段选择 `sql.Null*` 或指针，连接池参数基于 DB 和服务并发设置。",
      "Repository / NULL / pool 示例读取 `repository-patterns`；事务细节读取 `transactions`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Repository 接口、实现结构、事务边界和上下文超时策略。",
      "NULL 扫描、连接池参数、错误合同和测试替身建议。",
      "SQL 风险、迁移影响和需要压测的数据。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "repository-patterns",
      source: new URL("./references/repository-patterns.md", import.meta.url),
      target: "references/repository-patterns.md",
      title: "Go Repository 与数据库模式",
      summary: "Repository 接口、sql.ErrNoRows、NULLable 扫描和连接池配置示例。",
      loadWhen: "需要快速实现或审查 Go database/sql 数据访问层时读取。",
    }),
    defineReference({
      id: "transactions",
      source: new URL("./references/transactions.md", import.meta.url),
      target: "references/transactions.md",
      title: "transactions.md",
      summary: "Go 数据库事务模式：BeginTx、Rollback、Commit、嵌套事务与传播策略。",
      loadWhen: "需要设计或审查 Go 数据库事务边界与回滚逻辑时读取。",
    }),
  ],
});
