---
name: redis-cluster-ha
description: "部署和运维 Redis Sentinel、Cluster 与持久化策略，适用于高可用架构与容量规划"
---

# Redis Cluster & High Availability

## 适用场景

- 高可用架构选型：Sentinel vs Cluster。
- 持久化策略配置（RDB / AOF / 混合），平衡数据安全与性能。
- maxmemory 和淘汰策略制定，防止 OOM。
- 慢查询监控和运维基线建立。
- 分布式锁在集群下的考量参考 [redis-distributed-lock](../redis-distributed-lock/SKILL.md)，键分布参考 [redis-key-design](../redis-key-design/SKILL.md)。
- 完整配置和监控脚本见 [references/code-patterns.md](references/code-patterns.md)。

## 核心约束

- Sentinel 至少 3 节点，quorum = `(N/2)+1`（3 节点时 quorum=2）。
- Cluster multi-key 操作要求所有 key 在同一 hash slot，用 `{hashtag}` 保证。
- 生产环境必须开启持久化（至少 AOF），纯内存模式仅用于可丢失缓存。
- maxmemory 预留系统内存 20-30%（fork copy-on-write 开销），不设为物理内存 100%。
- SLOWLOG 阈值建议 10ms（10000 微秒），定期巡检并优化。

## 代码模式

```redis
# Cluster 节点核心配置
cluster-enabled yes
cluster-node-timeout 15000
appendonly yes
aof-use-rdb-preamble yes
maxmemory 4gb
maxmemory-policy allkeys-lru
slowlog-log-slower-than 10000
slowlog-max-len 256
```

## 检查清单

- Sentinel 是否至少 3 节点，quorum 是否为多数派。
- Cluster multi-key 操作是否用了 `{hashtag}`。
- 持久化是否开启，AOF fsync 是否满足 RPO 要求。
- maxmemory 是否预留 fork 开销，淘汰策略是否匹配业务场景。
- 是否配置 SLOWLOG 监控，是否有定期巡检机制。

## 反模式

- maxmemory 设为全部物理内存，fork 时 OOM。
- Sentinel 只部署 2 节点，分区时无法多数派选举。
- Cluster 下对不同 slot 的 key 执行 MGET/MSET，直接报错。
- 用 `noeviction` 策略却不监控内存，写满后所有写入被拒绝。
- 仅依赖 RDB 快照，两次快照间宕机数据全部丢失。
