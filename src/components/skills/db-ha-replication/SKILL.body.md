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
