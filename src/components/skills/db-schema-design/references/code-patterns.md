# JSONB Patterns 代码模式

## JSONB 列 + GIN 索引 + CHECK 约束

```sql
CREATE TABLE product (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT   NOT NULL,
    category    TEXT   NOT NULL,
    attributes  JSONB  NOT NULL DEFAULT '{}'::jsonb
                       CHECK (jsonb_typeof(attributes) = 'object'),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_attrs
    ON product USING gin (attributes jsonb_path_ops);
```

## 表达式索引 — 提取标量做高频查询

```sql
CREATE INDEX idx_product_brand
    ON product ((attributes ->> 'brand'));

SELECT id, name
  FROM product
 WHERE attributes ->> 'brand' = 'Apple';
```

## Generated Column — 把 JSONB 标量提升为关系列

```sql
ALTER TABLE product
    ADD COLUMN brand TEXT GENERATED ALWAYS AS (attributes ->> 'brand') STORED;

CREATE INDEX idx_product_brand_col ON product (brand);

SELECT id, name, brand
  FROM product
 WHERE brand = 'Apple';
```

## 包含运算符 @> 做结构匹配

```sql
SELECT id, name, attributes
  FROM product
 WHERE attributes @> '{"color": "red", "size": "L"}'::jsonb;

-- 查找包含 "wireless" 标签的商品
SELECT id, name
  FROM product
 WHERE attributes @> '{"tags": ["wireless"]}'::jsonb;
```

## jsonb_to_recordset — JSONB 数组展开为关系行

```sql
SELECT o.id AS order_id, item.*
  FROM purchase_order o,
       LATERAL jsonb_to_recordset(o.line_items) AS item(
           product_id BIGINT,
           quantity   INT,
           price      NUMERIC(12, 2)
       )
 WHERE o.id = 100;
```
