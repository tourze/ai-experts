# database-expert

数据库基座插件，提供跨 DBMS 通用的 SQL 安全审查、性能优化与破坏性命令拦截。

DBMS 专属能力由子插件提供，按需安装：
- [mysql-expert](../mysql-expert/README.md) — MySQL 表设计、索引、复制、事务、JSON
- [pgsql-expert](../pgsql-expert/README.md) — PostgreSQL 类型、索引、分区、JSONB、RLS
- [redis-expert](../redis-expert/README.md) — Redis 键设计、缓存、锁、数据结构、集群

## Skills

| Skill | 用途 |
|-------|------|
| `sql-code-review` | SQL 安全、正确性、可维护性审查 |
| `sql-optimization` | SQL 调优、执行计划分析、分页与批处理优化 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PreToolUse Bash | `dangerous-sql-guard` | 拦截 `DROP DATABASE/TABLE/SCHEMA` 和 `TRUNCATE TABLE` |

## 安装

```bash
claude plugin install database-expert@ai-experts
```

## 验证

```bash
node --test plugins/database-expert/tests/*.test.mjs
find plugins/database-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
```
