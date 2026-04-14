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

- `SessionStart`：运行插件自检，确认 `plugin.json` 声明的 `skills`、`hooks` 路径以及各个 `SKILL.md` 文件完整存在。
- 设计原则：只 `report` 不 `block`，检测失败时保持 fail-open，不影响正常加载。

## 安装

```bash
claude --plugin-dir /path/to/plugins/database-expert
```

## 验证

```bash
node --test plugins/database-expert/tests/*.test.mjs
find plugins/database-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
```
