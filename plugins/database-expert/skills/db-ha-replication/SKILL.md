---
name: db-ha-replication
description: "当用户要配置或排查数据库主从复制、GTID、半同步、故障切换或读写分离高可用架构时使用。"
---

# Database HA & Replication

## 适用场景

- 搭建或审查基于 GTID 的主从复制拓扑，配置异步或半同步复制。
- 实施读写分离架构，需要合理的 Replica 路由策略和延迟监控。
- 规划或执行故障切换（计划内与非计划），需要确认 GTID 集合一致性。
- 排查复制延迟、中断、数据不一致等运维问题。
- 需要理解事务与锁对复制的影响，联动 [mysql-transaction-locking](../mysql-transaction-locking/SKILL.md)。

## 核心约束

- 必须启用 GTID（`gtid_mode=ON`、`enforce_gtid_consistency=ON`）；GTID 让故障切换位点对齐自动化。
- Binlog 格式必须 `ROW`；STATEMENT 格式在非确定性函数下导致主从不一致。
- 高一致性场景必须开启半同步（`rpl_semi_sync_source_enabled`）；至少一个 Replica 确认收到后 Source 才提交。
- 复制延迟监控使用 `Seconds_Behind_Source`（SHOW REPLICA STATUS）+ 心跳表双保险。
- 故障切换前必须确认所有 Replica 的 GTID 集合一致，禁止在 GTID 有缺口时提升 Replica。

MySQL 复制运维详细内容见：[references/mysql-replication-ops.md](references/mysql-replication-ops.md)、[references/replication-config.md](references/replication-config.md)。

## 代码模式

```sql
-- Replica 配置复制源（MySQL 8.0.23+）
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST = '10.0.1.100',
    SOURCE_PORT = 3306,
    SOURCE_USER = 'repl',
    SOURCE_PASSWORD = '***',
    SOURCE_AUTO_POSITION = 1;

-- 检查 Replica 状态
SHOW REPLICA STATUS\G

-- 检查 GTID 执行情况
SELECT @@global.gtid_executed;
```

## 检查清单

- GTID 是否已启用且 enforce_gtid_consistency=ON。
- Binlog 格式是否为 ROW。
- 半同步复制是否在高一致性路径上启用。
- 复制延迟监控是否同时使用 Seconds_Behind_Source 和心跳表。
- 故障切换预案是否覆盖 GTID 缺口检测和 Replica 提升流程。
- 读写分离路由是否考虑了复制延迟容忍度。

## 反模式

- 使用 STATEMENT binlog 格式导致主从数据不一致。
- 不启用 GTID 导致故障切换时需要手动对齐位点。
- 只依赖 SHOW REPLICA STATUS 的 Seconds_Behind_Source 判断延迟（无法检测无写入时的静默延迟）。
- 在 GTID 有缺口时直接提升 Replica。
- 半同步降级为异步后不做告警。
