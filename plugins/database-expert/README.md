# database-expert

数据库专家插件，覆盖 MySQL/PostgreSQL 模式设计、Redis 缓存与数据结构设计、SQL 代码审查与性能优化。

## Skills

| Skill | 用途 |
|-------|------|
| `mysql-best-practices` | MySQL 表结构、索引、复制与运维基线 |
| `postgresql-table-design` | PostgreSQL 类型、约束、索引与分区设计 |
| `redis-best-practices` | Redis 键设计、缓存策略、并发与高可用 |
| `sql-code-review` | SQL 安全、正确性、可维护性审查 |
| `sql-optimization` | SQL 调优、执行计划分析、分页与批处理优化 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PreToolUse Bash | `dangerous-sql-guard` | 拦截 `DROP DATABASE/TABLE/SCHEMA` 和 `TRUNCATE TABLE` |

## 安装

```bash
claude --plugin-dir /path/to/plugins/database-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install database-expert@ai-experts
claude plugin install database-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall database-expert
claude plugin uninstall database-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
node --test plugins/database-expert/tests/*.test.mjs
find plugins/database-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
```
