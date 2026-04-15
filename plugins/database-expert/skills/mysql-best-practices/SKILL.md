---
name: mysql-best-practices
description: 当用户需要设计或审查 MySQL 表结构、索引、事务或复制策略时使用。
---

# MySQL Best Practices

## 适用场景

- 新建或审查 MySQL 8.x 业务表、索引、查询与复制拓扑。
- 排查慢查询、锁冲突、隐式类型转换、分页退化、JSON 字段滥用等问题。
- 为 PHP、Java、Node 等服务制定统一的 MySQL 建模与运维基线。
- 如果目标是通用 SQL 审查，联动 [sql-code-review](../sql-code-review/SKILL.md)；如果目标是具体慢 SQL 调优，联动 [sql-optimization](../sql-optimization/SKILL.md)。

## 核心约束

- 业务 OLTP 表默认使用 `InnoDB`、`utf8mb4` 和明确主键；不要把 MyISAM 当常规选项。
- 索引必须围绕真实访问路径设计，优先看 `EXPLAIN`、行数和回表成本，不靠直觉猜。
- 避免在索引列上套函数、混用字符串和数字比较、使用大偏移 `OFFSET` 分页。
- JSON 只承载稀疏或可变属性；高频过滤字段要落生成列或常规列并建立索引。
- 复制、隔离级别和连接池配置必须显式审查；新版本优先使用 `SHOW REPLICA STATUS\G` 等新命名。

## 代码模式

```sql
CREATE TABLE orders (
    order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'cancelled') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_orders_customer_created (customer_id, created_at),
    KEY idx_orders_status_created (status, created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

```sql
CREATE TABLE audit_events (
    event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payload JSON NOT NULL,
    user_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.user_id')) AS UNSIGNED)
    ) STORED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_events_user_created (user_id, created_at)
);
```

```sql
SELECT order_id, created_at, total_amount
FROM orders
WHERE customer_id = ?
  AND (created_at, order_id) < (?, ?)
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

```ini
[mysqld]
innodb_buffer_pool_size = 8G
innodb_flush_log_at_trx_commit = 1
max_connections = 300
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

## 检查清单

- 表是否明确声明了主键、字符集、排序规则和关键二级索引。
- 外键列、分页列、排序列是否都对应到可用索引，而不是只建单列“心理安慰索引”。
- 查询是否避免了 `SELECT *`、函数包裹索引列、字符串比较整数列和大偏移分页。
- JSON 字段里的高频查询属性是否已经转为生成列或普通列，并具备索引。
- 复制拓扑、只读节点路由、慢日志、连接数与事务隔离级别是否有明确运维基线。

## 反模式

- 为了“省事”把所有字符串都定义成 `VARCHAR(255)`，却从不回看真实长度与索引宽度。
- 把金额存成 `FLOAT` / `DOUBLE`，然后在对账时才发现精度飘移。
- 仍然依赖旧版复制状态命令、查询缓存等过时习惯，却假设脚本在新版本里不会漂移。
- 把 JSON 当万能替代品，最后所有高频过滤都退化成全表扫描。
- 看到分页慢就先加更多索引，却不先把 `OFFSET` 翻页改成游标翻页。
