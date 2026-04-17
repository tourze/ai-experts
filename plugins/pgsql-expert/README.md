# pgsql-expert

PostgreSQL 专家插件，覆盖模式设计、索引策略、声明式分区、JSONB 模式与行级安全。

## 依赖

- [database-expert](../database-expert/README.md) — 提供跨 DBMS 的 SQL 审查（`sql-code-review`）和 SQL 调优（`sql-optimization`）

## Skills

| Skill | 用途 |
|-------|------|
| `pgsql-index-strategy` | B-tree / GIN / GiST、部分索引与表达式索引 |
| `pgsql-jsonb-patterns` | JSONB 存储、查询、索引与验证 |
| `pgsql-partitioning` | 声明式分区、裁剪验证与生命周期管理 |
| `pgsql-row-level-security` | RLS 策略、多租户隔离与角色管理 |
| `pgsql-schema-design` | 表结构、原生类型、约束与命名规范 |

## 安装

```bash
claude plugin install pgsql-expert@ai-experts
```

## 卸载

```bash
claude plugin uninstall pgsql-expert
claude plugin uninstall pgsql-expert --scope project
```

## 验证

```bash
node --test plugins/pgsql-expert/tests/*.test.mjs
```
