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
