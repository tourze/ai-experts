# redis-expert

Redis 专家插件，覆盖键空间设计、缓存模式、分布式锁、数据结构选型与集群高可用。

## 依赖

- [database-expert](../database-expert/README.md) — 提供跨 DBMS 的 SQL 审查（`sql-code-review`）和 SQL 调优（`sql-optimization`）

## Skills

| Skill | 用途 |
|-------|------|
| `redis-caching-patterns` | 缓存旁路、写穿、雪崩与穿透防护 |
| `redis-cluster-ha` | Sentinel、Cluster、持久化与容量规划 |
| `redis-data-structures` | String / Hash / ZSet / Stream / HyperLogLog 选型 |
| `redis-distributed-lock` | 分布式锁获取、续期与安全释放 |
| `redis-key-design` | 键命名、命名空间、TTL 与生命周期管理 |

## 安装

```bash
claude plugin install redis-expert@ai-experts
```

## 验证

```bash
node --test plugins/redis-expert/tests/*.test.mjs
```
