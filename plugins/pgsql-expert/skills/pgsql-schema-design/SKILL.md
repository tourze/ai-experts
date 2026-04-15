---
name: pgsql-schema-design
description: "设计和审查 PostgreSQL 表结构、原生类型、约束与命名规范，适用于利用 PG 特性的业务建模"
---

# PostgreSQL Schema Design

## 适用场景

- 新建业务表或审查已有表结构，需要选择 PostgreSQL 原生类型
- 定义主键策略、外键关系、唯一约束与 CHECK 约束
- 建立或统一 snake_case 无引号命名规范
- 需要为 JSONB 列预留位置 — 深入使用参见 [pgsql-jsonb-patterns](../pgsql-jsonb-patterns/SKILL.md)
- 表建好后需要覆盖索引 — 参见 [pgsql-index-strategy](../pgsql-index-strategy/SKILL.md)

## 核心约束

- 主键用 `BIGINT GENERATED ALWAYS AS IDENTITY`，不用 `serial`（identity column 是 SQL 标准且行为更可控）
- 时间列一律 `TIMESTAMPTZ`，禁止裸 `timestamp`（丢失时区会在跨区部署时引发静默错误）
- 金额用 `NUMERIC`，禁止 `float` / `real`（浮点舍入在财务场景不可接受）
- 通用字符串用 `TEXT`，不用 `varchar(n)`（PostgreSQL 内部存储无差异，`varchar(n)` 只增加维护负担）
- 标识符用 unquoted snake_case，禁止 `"QuotedCamelCase"`（避免大小写敏感性移植问题）

## 代码模式

详细示例参见 [references/code-patterns.md](./references/code-patterns.md)。核心模板：

```sql
CREATE TABLE order_item (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT       NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    quantity    INT          NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

## 检查清单

- 主键是否为 `BIGINT GENERATED ALWAYS AS IDENTITY`
- 时间列是否为 `TIMESTAMPTZ` 且带 `NOT NULL DEFAULT now()`
- 金额列是否为 `NUMERIC(p,s)` 且有 CHECK 约束
- 外键是否显式声明 `ON DELETE` 行为（CASCADE / RESTRICT / SET NULL）
- 是否为表和关键列添加了 `COMMENT ON`

## 反模式

- 用 `serial` 代替 identity column — 旧式语法糖，无法 `ALTER COLUMN ... SET GENERATED`
- 用 `timestamp` 代替 `TIMESTAMPTZ` — 多时区环境丢失上下文
- 用 `varchar(255)` 代替 `TEXT` — 存储无差异，只增加迁移负担
- 用 `float` 存储金额 — 浮点舍入导致对账偏差
- 用 `"CamelCase"` 双引号标识符 — 跨工具不一致
