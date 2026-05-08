---
name: pgsql-schema-design
description: "当用户要设计或审查 PostgreSQL 表结构、原生类型、约束或命名规范时使用。"
---

# PostgreSQL Schema Design

## 适用场景

- 新建业务表或审查已有表结构，需要选择 PostgreSQL 原生类型
- 定义主键策略、外键关系、唯一约束与 CHECK 约束
- 建立或统一 snake_case 无引号命名规范
- 需要为 JSONB 列预留位置 — 深入使用参见 [pgsql-jsonb-patterns](./pgsql-jsonb-patterns.md)
- 表建好后需要覆盖索引 — 参见 [pgsql-index-strategy](../pgsql-index-strategy/SKILL.md)

## 核心约束

- 主键用 `BIGINT GENERATED ALWAYS AS IDENTITY`，不用 `serial`（identity column 是 SQL 标准且行为更可控）
- 时间列一律 `TIMESTAMPTZ`，禁止裸 `timestamp`（丢失时区会在跨区部署时引发静默错误）
- 金额用 `NUMERIC`，禁止 `float` / `real`（浮点舍入在财务场景不可接受）
- 通用字符串用 `TEXT`，不用 `varchar(n)`（PostgreSQL 内部存储无差异，`varchar(n)` 只增加维护负担）
- 标识符用 unquoted snake_case，禁止 `"QuotedCamelCase"`（避免大小写敏感性移植问题）

## 代码模式

详细示例参见 [references/code-patterns.md](./code-patterns.md)。核心模板：

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

### FAIL: 裸 timestamp

```sql
CREATE TABLE events (created_at timestamp NOT NULL);
INSERT INTO events VALUES ('2026-04-16 10:00:00');
-- 服务器在 UTC：存 10:00:00 UTC
-- 服务器迁到 PST：再存 10:00:00 → 实际是 18:00 UTC
-- 历史数据时区上下文丢失，无法修复
```

### PASS: TIMESTAMPTZ

```sql
CREATE TABLE events (created_at TIMESTAMPTZ NOT NULL DEFAULT now());
-- 始终以 UTC 存储 + 客户端按时区显示
-- 跨时区部署、夏令时切换都安全
```

### FAIL: float 存金额

```sql
CREATE TABLE invoices (amount real);
INSERT INTO invoices VALUES (0.1), (0.2);
SELECT SUM(amount) FROM invoices;  -- 0.30000000447034836
```

### PASS: NUMERIC + CHECK

```sql
CREATE TABLE invoices (
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0)
);
SELECT SUM(amount) FROM invoices;  -- 0.30 精确
```

### FAIL: serial 旧式

```sql
CREATE TABLE t (id serial PRIMARY KEY);
-- serial 是语法糖：自动建 sequence，但 sequence 所有权管理混乱
-- DROP COLUMN 后 sequence 不会自动清理
-- 无法 ALTER ... SET GENERATED
```

### PASS: identity column

```sql
CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY);
-- SQL 标准
-- 默认 ALWAYS 阻止应用插入显式 id
-- 完全集成在列定义中，DROP/ALTER 行为可控
```
