# database-expert

统一数据库专家能力，覆盖 MySQL、PostgreSQL 与 Redis 的表结构设计、索引策略、SQL 审查与调优、事务与锁、复制与高可用、JSON/JSONB、缓存模式、数据结构选型与分布式锁。

## Skills

| Skill | 用途 |
|-------|------|
| `db-index-strategy` | 跨引擎索引策略（MySQL B+Tree / PostgreSQL B-tree, GIN, GiST, BRIN）、复合索引顺序与 EXPLAIN |
| `db-schema-design` | 表结构、列类型、约束、字符集、JSON/JSONB 与半结构化数据建模 |
| `sql-review-optimization` | SQL 审查（安全/正确性/运维风险）+ 慢查询调优（EXPLAIN / 索引 / 分页 / join order） |
| `db-ha-replication` | 主从复制、GTID、半同步与故障切换 |
| `mysql-transaction-locking` | InnoDB 事务隔离、行锁、间隙锁与死锁诊断 |
| `pgsql-row-level-security` | RLS 策略、多租户隔离与角色权限管理 |
| `pgsql-partitioning` | 声明式分区、裁剪验证与生命周期管理 |
| `redis-caching-patterns` | 缓存旁路、写穿、雪崩与穿透防护 |
| `redis-cluster-ha` | Sentinel、Cluster、持久化与容量规划 |
| `redis-data-modeling` | 数据结构选型（String/Hash/ZSet/Stream）、键命名规范与分布式锁 |
| `redis-pitfall-diagnostics` | 诡异行为、卡顿、OOM、TTL 异常、主从不一致排查 |

## Agents

| Agent | 用途 |
|-------|------|
| `db-reviewer` | 只读审查 MySQL/PostgreSQL/Redis schema、索引、SQL、缓存模式与高可用配置 |
| `db-lifecycle-engineer` | 端到端数据库全生命周期编排：schema 设计、索引策略、SQL 优化、高可用方案、分区、缓存与数据建模，可写设计文档与迁移方案 |

## Hooks

| Hook | 用途 |
|------|------|
| `redis-cli-risk-guard` | 拦截或提示高风险 `redis-cli` 命令（KEYS / MONITOR / FLUSHALL / FLUSHDB 等） |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/database-expert/tests/*.test.mjs
```
