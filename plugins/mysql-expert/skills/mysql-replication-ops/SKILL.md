---
name: mysql-replication-ops
description: "当用户要配置或排查 MySQL 主从复制、GTID、半同步或故障切换时使用。适用于读写分离与高可用运维。"
---

# MySQL Replication Operations

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

## 代码模式

```sql
-- Replica 配置复制源（MySQL 8.0.23+ 新语法）
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST = '10.0.1.100',
    SOURCE_PORT = 3306,
    SOURCE_USER = 'repl_user',
    SOURCE_PASSWORD = 'strong_password_here',
    SOURCE_AUTO_POSITION = 1,
    GET_SOURCE_PUBLIC_KEY = 1;
START REPLICA;
SHOW REPLICA STATUS\G
```

- Source/Replica 的 my.cnf 配置、状态监控字段解读和计划内切换步骤见 [references/replication-config.md](references/replication-config.md)。

## 检查清单

- GTID 是否在所有节点启用，`enforce_gtid_consistency` 是否为 ON。
- Binlog 格式是否为 ROW，`binlog_row_image` 是否为 FULL。
- Replica 是否启用了 `read_only` 和 `super_read_only`，防止误写。
- 复制延迟监控是否到位，告警阈值是否合理。
- 故障切换流程是否有文档化的 runbook，是否定期演练。

## 反模式

- 使用 `binlog_format=STATEMENT`：`UUID()`、`NOW()`、`RAND()` 等导致主从数据不一致。
- 不启用 GTID 依赖手动 binlog 位点：故障切换需人工计算偏移量，容易出错。
- Replica 未设 `super_read_only=ON`：应用误连 Replica 写入导致 GTID 集合分叉。
- 仅靠 `Seconds_Behind_Source` 判断延迟：IO 线程中断时显示 NULL，不反映真实延迟。
- 故障切换时不检查 GTID 缺口直接提升 Replica：缺失事务不会自动补回，导致数据不一致。
