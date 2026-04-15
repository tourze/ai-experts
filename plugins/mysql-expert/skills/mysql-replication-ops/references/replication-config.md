# 复制配置与运维详解

## Source 端 my.cnf 配置

```ini
[mysqld]
# GTID
server-id                       = 1
gtid_mode                       = ON
enforce_gtid_consistency        = ON

# Binlog
log_bin                         = /var/lib/mysql/binlog
binlog_format                   = ROW
binlog_row_image                = FULL
binlog_expire_logs_seconds      = 604800   # 7 天
sync_binlog                     = 1

# 半同步（Source 端）
plugin_load_add                 = semisync_source=semisync_source.so
rpl_semi_sync_source_enabled    = 1
rpl_semi_sync_source_timeout    = 3000     # 3 秒超时后降级为异步

# 事务持久化
innodb_flush_log_at_trx_commit  = 1
```

## Replica 端 my.cnf 关键配置

```ini
[mysqld]
server-id                       = 2
gtid_mode                       = ON
enforce_gtid_consistency        = ON
relay_log                       = /var/lib/mysql/relay-bin
read_only                       = ON
super_read_only                 = ON
log_replica_updates             = ON

# 半同步（Replica 端）
plugin_load_add                 = semisync_replica=semisync_replica.so
rpl_semi_sync_replica_enabled   = 1
```

## SHOW REPLICA STATUS 关键字段

```
Replica_IO_Running:  Yes    -- IO 线程是否正常拉取 binlog
Replica_SQL_Running: Yes    -- SQL 线程是否正常回放
Seconds_Behind_Source: 0    -- 复制延迟秒数，持续 > 0 需排查
Retrieved_Gtid_Set:         -- 已拉取的 GTID 集合
Executed_Gtid_Set:          -- 已执行的 GTID 集合
Last_IO_Error:              -- IO 线程最近错误
Last_SQL_Error:             -- SQL 线程最近错误
```

## 心跳表延迟监控

```sql
-- Source 端定时写入
UPDATE heartbeat SET ts = NOW(6), server_id = @@server_id WHERE id = 1;

-- Replica 端查询延迟
SELECT TIMESTAMPDIFF(MICROSECOND, ts, NOW(6)) / 1000000 AS lag_seconds
FROM heartbeat WHERE id = 1;
```

## 计划内故障切换步骤

```sql
-- 1. Source 端：停止写入
SET GLOBAL read_only = ON;
SET GLOBAL super_read_only = ON;
SHOW MASTER STATUS;   -- 记录 Executed_Gtid_Set

-- 2. 目标 Replica：等待追齐
SHOW REPLICA STATUS\G
-- 确认 Seconds_Behind_Source = 0 且 Executed_Gtid_Set 一致

-- 3. 目标 Replica：提升为新 Source
STOP REPLICA;
RESET REPLICA ALL;
SET GLOBAL read_only = OFF;
SET GLOBAL super_read_only = OFF;

-- 4. 其他 Replica：指向新 Source
STOP REPLICA;
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST = '10.0.1.101',
    SOURCE_PORT = 3306,
    SOURCE_AUTO_POSITION = 1;
START REPLICA;

-- 5. 更新应用层连接配置或 VIP/DNS
```
