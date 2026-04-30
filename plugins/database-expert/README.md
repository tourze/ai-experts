# database-expert

数据库基座能力，提供跨 DBMS 通用的 SQL 安全审查、性能优化与破坏性命令拦截。

DBMS 专属能力由对应 expert 提供，按需安装：
- [mysql-expert](../mysql-expert/README.md) — MySQL 表设计、索引、复制、事务、JSON
- [pgsql-expert](../pgsql-expert/README.md) — PostgreSQL 类型、索引、分区、JSONB、RLS
- [redis-expert](../redis-expert/README.md) — Redis 键设计、缓存、锁、数据结构、集群

## Skills

| Skill | 用途 |
|-------|------|
| `sql-code-review` | SQL 安全、正确性、可维护性审查 |
| `sql-optimization` | SQL 调优、执行计划分析、分页与批处理优化 |

## Agents

| Agent | 用途 |
|-------|------|
| `schema-reviewer` | 数据库 schema、迁移、查询与索引策略的只读评审 |
| `db-migration-reviewer` | 数据库迁移脚本与复制 / 分区 / RLS 配置变更的只读审查，含在线 DDL 风险评估 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PreToolUse Bash | `dangerous-sql-guard` | 拦截 `DROP DATABASE/TABLE/SCHEMA` 和 `TRUNCATE TABLE` |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/database-expert/tests/*.test.mjs
find plugins/database-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
```
