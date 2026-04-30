# redis-expert

Redis 专家能力，覆盖键空间设计、缓存模式、分布式锁、数据结构选型与集群高可用。

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
| `redis-pitfall-diagnostics` | 诡异行为、卡顿、OOM、TTL 异常、主从不一致与复制失败排查 |

## Agents

| Agent | 用途 |
|-------|------|
| `redis-reviewer` | review Redis key design, data structure choices, caching patterns, cluster configuration, and memory optimization |

## Hooks

| Hook | 用途 |
|------|------|
| `redis-cli-risk-guard` | 拦截或提示当前 agent 直接执行的高风险 `redis-cli` 命令 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/redis-expert/tests/*.test.mjs
```
