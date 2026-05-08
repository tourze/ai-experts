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
- 需要理解事务与锁对复制的影响，联动 [mysql-transaction-locking](../../mysql-transaction-locking/SKILL.md)。

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

- Source/Replica 的 my.cnf 配置、状态监控字段解读和计划内切换步骤见 [references/replication-config.md](./replication-config.md)。

## 检查清单

- GTID 是否在所有节点启用，`enforce_gtid_consistency` 是否为 ON。
- Binlog 格式是否为 ROW，`binlog_row_image` 是否为 FULL。
- Replica 是否启用了 `read_only` 和 `super_read_only`，防止误写。
- 复制延迟监控是否到位，告警阈值是否合理。
- 故障切换流程是否有文档化的 runbook，是否定期演练。

## 反模式

### FAIL: STATEMENT binlog 格式

```ini
binlog_format = STATEMENT
```

```sql
-- Source 执行
INSERT INTO orders (id, code) VALUES (NULL, UUID());
-- Source 上 UUID = 'a1b2...'，Replica 上 UUID = 'c3d4...'
-- 主从数据分叉，故障切换后丢失订单
```

### PASS: ROW 格式 + FULL image

```ini
binlog_format = ROW
binlog_row_image = FULL
```

```sql
INSERT INTO orders (id, code) VALUES (NULL, UUID());
-- binlog 记录实际行数据，Replica 完全复制
```

### FAIL: Replica 未 super_read_only

```ini
read_only = ON
# 缺 super_read_only
```

```sql
-- 应用误连 Replica（DNS 切换 / 配置错误）
GRANT REPLICATION_SLAVE_ADMIN TO 'app'@'%';
-- 拥有 SUPER 权限的连接能绕过 read_only → 写入产生本地 GTID
-- 与 Source 的 GTID 集合分叉，故障切换时数据不一致
```

### PASS: super_read_only

```ini
read_only = ON
super_read_only = ON
```

```sql
-- 任何连接（包括 SUPER）写入都被拒绝
-- 唯一例外：复制线程
```

### FAIL: 只看 Seconds_Behind_Source

```sql
SHOW REPLICA STATUS\G
-- Seconds_Behind_Source: 0 → "复制正常"
-- 实际：IO 线程中断中，最近 1 小时没收到 Source 日志
```

### PASS: 心跳表 + 多指标

```sql
-- Source 每 1s 写心跳
CREATE EVENT heartbeat ON SCHEDULE EVERY 1 SECOND
DO REPLACE INTO repl_heartbeat (id, ts) VALUES (1, NOW(6));

-- Replica 监控心跳延迟
SELECT TIMESTAMPDIFF(MICROSECOND, ts, NOW(6))/1000 AS lag_ms FROM repl_heartbeat;
-- 同时观察 IO_Running, SQL_Running, Last_IO_Error
```
