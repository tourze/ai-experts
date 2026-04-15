# Index Strategy 代码模式

## 部分索引 — 只索引活跃数据

```sql
-- 只为未完成订单建索引，占总数据量 < 5%
CREATE INDEX idx_order_active_status
    ON purchase_order (status, created_at)
    WHERE status NOT IN ('completed', 'cancelled');

-- 查询 WHERE 必须包含索引的过滤条件
SELECT id, total_amount, created_at
  FROM purchase_order
 WHERE status = 'pending'
   AND created_at > now() - INTERVAL '7 days'
 ORDER BY created_at DESC;
```

## 表达式索引 — 大小写不敏感匹配

```sql
CREATE UNIQUE INDEX idx_user_lower_email
    ON app_user (lower(email));

SELECT id, display_name
  FROM app_user
 WHERE lower(email) = lower('Alice@Example.com');
```

## GIN 索引 — JSONB 包含查询

```sql
-- jsonb_path_ops 体积更小，仅支持 @> 运算符
CREATE INDEX idx_product_attrs_gin
    ON product USING gin (attributes jsonb_path_ops);

SELECT id, name
  FROM product
 WHERE attributes @> '{"color": "red", "size": "L"}';
```

## 覆盖索引 — 实现 index-only scan

```sql
CREATE INDEX idx_invoice_customer_date
    ON invoice (customer_id, invoice_date DESC)
    INCLUDE (total_amount, status);

-- EXPLAIN 应显示 "Index Only Scan"
EXPLAIN (ANALYZE, BUFFERS)
SELECT invoice_date, total_amount, status
  FROM invoice
 WHERE customer_id = 42
 ORDER BY invoice_date DESC
 LIMIT 20;
```

## 识别未使用索引

```sql
SELECT schemaname, relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
 WHERE idx_scan = 0
   AND schemaname = 'public'
 ORDER BY pg_relation_size(indexrelid) DESC;
```
