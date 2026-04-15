# JSON 与生成列模式详解

## ->> 操作符与 JSON 路径查询

```sql
-- ->> 返回无引号文本（等价于 JSON_UNQUOTE(JSON_EXTRACT(...))）
SELECT
    attrs->>'$.color'       AS color,         -- 返回: red（无引号）
    attrs->'$.color'        AS color_quoted,   -- 返回: "red"（带引号）
    attrs->>'$.tags[0]'     AS first_tag,      -- 数组第一个元素
    attrs->>'$.nested.key'  AS nested_val      -- 嵌套路径
FROM products
WHERE id = 1;
```

## JSON_CONTAINS 与 JSON_OVERLAPS

```sql
-- JSON_CONTAINS：检查 JSON 数组是否包含某值
SELECT * FROM products
WHERE JSON_CONTAINS(attrs->'$.tags', '"electronics"');

-- JSON_OVERLAPS（MySQL 8.0.17+）：检查两个 JSON 数组是否有交集
SELECT * FROM products
WHERE JSON_OVERLAPS(attrs->'$.tags', '["electronics", "sale"]');
```

## 多值索引（MySQL 8.0.17+）

```sql
-- 对 JSON 数组建多值索引，无需生成列
CREATE TABLE events (
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(200) NOT NULL,
    data    JSON NOT NULL,
    KEY idx_tags ((CAST(data->'$.tags' AS CHAR(50) ARRAY)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 利用多值索引查询
SELECT * FROM events
WHERE 'urgent' MEMBER OF (data->'$.tags');
```

## JSON_TABLE：将 JSON 展开为关系行

```sql
-- 将订单中的 items JSON 数组展开用于报表
SELECT
    o.id            AS order_id,
    o.order_no,
    jt.product_name,
    jt.quantity,
    jt.unit_price,
    jt.quantity * jt.unit_price AS line_total
FROM orders o,
JSON_TABLE(
    o.items,
    '$[*]' COLUMNS (
        product_name VARCHAR(200) PATH '$.name',
        quantity     INT          PATH '$.qty',
        unit_price   DECIMAL(10,2) PATH '$.price'
    )
) AS jt
WHERE o.id = 12345;
```

典型用途：
1. 报表查询中展开嵌套结构
2. 与其他关系表 JOIN
3. 数据迁移：从 JSON 列批量提取到范式化表

## VIRTUAL vs STORED 选型

| 维度 | VIRTUAL | STORED |
|------|---------|--------|
| 磁盘占用 | 无 | 有 |
| 读取时计算 | 每次 | 不需要 |
| 普通索引 | 支持 | 支持 |
| 覆盖索引 | 不支持 | 支持 |
| 适用场景 | 过滤条件、偶尔读取 | 排序、覆盖索引、频繁读取 |
