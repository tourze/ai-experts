---
name: db-schema-design
description: "当用户要设计或审查数据库表结构、列类型、约束、字符集、JSON 列或半结构化数据建模时使用。"
---

# Database Schema Design

## 适用场景

- 新建或变更业务表，需要确定列类型、主键策略、字符集与约束。
- 审查 CREATE TABLE 语句的类型精度、约束完整性和默认值合理性。
- 表含稀疏或半结构化属性，需判断用 JSON/JSONB 列还是范式化。
- 对 JSON 内部字段建索引以支持查询过滤。
- 与索引设计联动，为索引打好列基础，联动 [db-index-strategy](../db-index-strategy/SKILL.md)。
- 与 SQL 调优联动，表结构决定查询路径的上限，联动 [sql-review-optimization](../sql-review-optimization/SKILL.md)。

## 核心约束

### 通用原则

- 业务允许的列显式 `NOT NULL DEFAULT ...`；可空列增加索引和优化器负担。
- 金额必须精确数值类型，禁止 FLOAT/DOUBLE。
- 所有表必须有明确的主键和存储引擎选择。

### MySQL 特化

- 主键必须 `BIGINT UNSIGNED AUTO_INCREMENT`；禁止 INT（溢出风险）和 UUID 聚簇索引（页分裂、写放大）。
- 字符集统一 `utf8mb4`，排序规则优先 `utf8mb4_0900_ai_ci`；禁止 `utf8`（不能存 4 字节字符）。
- 引擎默认 InnoDB；选择其他引擎须在注释中说明理由。
- JSON 列不能有默认值、不能做主键；高频过滤/排序字段必须提取为生成列（VIRTUAL/STORED）并建索引。
- 使用 `->>` 获取无引号文本值；JSON 数组场景优先评估多值索引（MySQL 8.0.17+）。

### PostgreSQL 特化

- 主键用 `BIGINT GENERATED ALWAYS AS IDENTITY`，不用 `serial`。
- 时间列一律 `TIMESTAMPTZ`，禁止裸 `timestamp`。
- 通用字符串用 `TEXT`，不用 `varchar(n)`（内部存储无差异）。
- 标识符用 unquoted snake_case，禁止 `"QuotedCamelCase"`。
- 使用 `JSONB` 而非 `JSON`（JSONB 支持索引，JSON 只是文本存储）。
- JSONB 列必须有 CHECK 约束验证顶层类型；嵌套控制在 3 层以内。

详细引擎专有模式见：[references/mysql-schema-design.md](references/mysql-schema-design.md)、[references/pgsql-schema-design.md](references/pgsql-schema-design.md)、[references/mysql-json-generated-columns.md](references/mysql-json-generated-columns.md)、[references/pgsql-jsonb-patterns.md](references/pgsql-jsonb-patterns.md)。

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
