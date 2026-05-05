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

## 反模式

- 使用 STATEMENT binlog 格式导致主从数据不一致。
- 不启用 GTID 导致故障切换时需要手动对齐位点。
- 只依赖 SHOW REPLICA STATUS 的 Seconds_Behind_Source 判断延迟（无法检测无写入时的静默延迟）。
- 在 GTID 有缺口时直接提升 Replica。
- 半同步降级为异步后不做告警。
