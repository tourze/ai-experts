# 索引模式详解

## 覆盖索引示例

```sql
-- 如果查询只需要 order_no 和 total_amount，可扩展为覆盖索引
CREATE INDEX idx_user_status_created_cover ON orders (
    user_id, status, created_at, order_no, total_amount
);

-- EXPLAIN 中 Extra 应显示 "Using index"，表示无需回表
```

## EXPLAIN 输出字段详解

```
type:
  ref        → 使用非唯一索引的等值查找（理想）
  range      → 索引范围扫描（可接受）
  ALL        → 全表扫描（必须优化）
  index      → 全索引扫描（通常也需优化）

key:         实际使用的索引名
key_len:     使用的索引前缀字节数，用于判断复合索引命中了几列
rows:        估算扫描行数，越小越好

Extra:
  Using index            → 覆盖索引命中，无需回表
  Using where            → 存储引擎返回后在 Server 层再过滤
  Using filesort         → 额外排序，考虑优化索引顺序
  Using temporary        → 创建临时表，常见于 GROUP BY 无索引
  Using index condition  → ICP，存储引擎层做条件下推
```

## 前缀索引与区分度评估

```sql
-- 评估不同前缀长度的区分度
SELECT
    COUNT(DISTINCT LEFT(email, 6))  / COUNT(*) AS sel_6,
    COUNT(DISTINCT LEFT(email, 8))  / COUNT(*) AS sel_8,
    COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS sel_10,
    COUNT(DISTINCT email)           / COUNT(*) AS sel_full
FROM users;

-- 当 sel_10 接近 sel_full（>= 95%）时，使用前缀长度 10
CREATE INDEX idx_email_prefix ON users (email(10));

-- 注意：前缀索引不能用于 ORDER BY email，也不能做覆盖索引
```

## 冗余索引检测查询

```sql
SELECT t.TABLE_SCHEMA, t.TABLE_NAME,
       t.INDEX_NAME AS redundant_index,
       t.COLUMN_NAMES AS redundant_columns,
       s.INDEX_NAME AS covering_index,
       s.COLUMN_NAMES AS covering_columns
FROM (
    SELECT TABLE_SCHEMA, TABLE_NAME, INDEX_NAME,
           GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMN_NAMES
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'your_db'
    GROUP BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME
) t
JOIN (
    SELECT TABLE_SCHEMA, TABLE_NAME, INDEX_NAME,
           GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMN_NAMES
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'your_db'
    GROUP BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME
) s ON t.TABLE_SCHEMA = s.TABLE_SCHEMA
   AND t.TABLE_NAME = s.TABLE_NAME
   AND t.INDEX_NAME != s.INDEX_NAME
   AND s.COLUMN_NAMES LIKE CONCAT(t.COLUMN_NAMES, ',%');
```
