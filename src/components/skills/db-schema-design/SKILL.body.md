## 代码模式

```sql
-- MySQL：标准表结构
CREATE TABLE orders (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT UNSIGNED NOT NULL,
    order_no     VARCHAR(32)     NOT NULL,
    status       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=待支付 1=已支付 2=已发货',
    total_amount DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PostgreSQL：标准表结构
CREATE TABLE order_item (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id),
    product_id  BIGINT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price  NUMERIC(10, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PostgreSQL JSONB 列 + GIN 索引 + CHECK 约束
CREATE TABLE product (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL,
    attrs JSONB NOT NULL CHECK (jsonb_typeof(attrs) = 'object'),
    attr_color TEXT GENERATED ALWAYS AS (attrs->>'color') STORED
);
CREATE INDEX idx_product_attrs ON product USING GIN (attrs jsonb_path_ops);
```

## 检查清单

- 主键策略是否匹配引擎特性（InnoDB 聚簇 / PostgreSQL identity）。
- 金额列是否使用精确数值类型。
- 字符集和排序规则是否统一（MySQL utf8mb4 / PostgreSQL 默认 UTF-8）。
- nullable 列是否有合理的 DEFAULT 值。
- JSON/JSONB 列是否有 CHECK 约束，高频过滤字段是否提取为生成列。
- 标识符命名是否统一（snake_case）且避免了保留字。
- 外键是否显式声明（PostgreSQL）或在应用层有约束保证（MySQL）。

## 反模式

- MySQL 用 INT 做主键，低估了数据增长。
- MySQL 用 utf8 字符集（实际是 utf8mb3）。
- PostgreSQL 用 `varchar(n)` 而非通用 `TEXT`。
- 金额用 FLOAT/DOUBLE 导致精度丢失。
- 把大量高频过滤字段塞进 JSON 列而不提为独立列。
- 用 JSON 而不是 JSONB（PostgreSQL）。
