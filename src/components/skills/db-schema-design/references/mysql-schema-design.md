---
name: mysql-schema-design
description: "当用户要设计或审查 MySQL 8.x 表结构、列类型、字符集、引擎选择或主键策略时使用。"
---

# MySQL Schema Design

## 适用场景

- 新建或变更业务表，需要确定列类型、主键策略、字符集与存储引擎。
- 审查 CREATE TABLE 语句的类型精度、约束完整性和默认值合理性。
- OLTP 数据建模中需要在范式化与查询性能之间取舍。
- 需要为索引打好列基础，联动 [mysql-index-strategy](../mysql-index-strategy/SKILL.md)。
- 表含稀疏或半结构化属性，需判断是否用 JSON 列，联动 [mysql-json-generated-columns](./mysql-json-generated-columns.md)。

## 核心约束

- 主键必须 `BIGINT UNSIGNED AUTO_INCREMENT`；禁止 INT（21 亿溢出）和 UUID 聚簇索引（页分裂、写放大）。
- 金额必须 `DECIMAL(p, s)`；禁止 `FLOAT`/`DOUBLE`，浮点精度丢失在财务场景不可接受。
- 字符集统一 `utf8mb4`，排序规则优先 `utf8mb4_0900_ai_ci`；禁止 `utf8`（实际 utf8mb3，不能存 4 字节字符）。
- 业务允许的列显式 `NOT NULL DEFAULT ...`；可空列增加索引和优化器负担。
- 引擎默认 InnoDB；选择其他引擎须在注释中说明理由。

## 代码模式

```sql
CREATE TABLE orders (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT UNSIGNED NOT NULL,
    order_no     VARCHAR(32)     NOT NULL,
    status       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=待支付 1=已支付 2=已发货',
    total_amount DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    paid_at      DATETIME        NULL COMMENT '未支付时为 NULL',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_order_no (order_no),
    KEY idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

- 更多反例与 ENUM/DATETIME/TIMESTAMP 选型对比见 [references/type-selection.md](./type-selection.md)。

## 检查清单

- 主键是否 `BIGINT UNSIGNED AUTO_INCREMENT`，是否避免了复合主键和 UUID 聚簇索引。
- 金额列是否 `DECIMAL`，精度位数是否满足业务上限。
- 字符集是否 `utf8mb4`，排序规则是否合理。
- 非空列是否显式 `NOT NULL DEFAULT`，可空列是否确实有业务语义。
- 表定义是否包含 `ENGINE`、`CHARSET`、`COLLATE` 和 `COMMENT`。

## 反模式

### FAIL: FLOAT 存金额

```sql
CREATE TABLE orders (total_amount FLOAT);
INSERT INTO orders VALUES (0.1), (0.2);
SELECT SUM(total_amount) FROM orders;  -- 0.30000000447034836
-- 财务对账每月差几分到几元，没人能解释
```

### PASS: DECIMAL 精确存储

```sql
CREATE TABLE orders (total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00);
INSERT INTO orders VALUES (0.10), (0.20);
SELECT SUM(total_amount) FROM orders;  -- 0.30 精确
```

### FAIL: UUID 当聚簇主键

```sql
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,  -- 'a1b2c3d4-...'
    ...
);
-- UUID 随机分布 → InnoDB B+Tree 频繁页分裂 → 写入性能比 BIGINT 慢 3-5 倍
-- 索引体积也大 4 倍（CHAR(36) vs BIGINT 8 字节）
```

### PASS: BIGINT 自增主键 + UUID 业务列

```sql
CREATE TABLE orders (
    id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_uuid CHAR(36) NOT NULL,
    UNIQUE KEY uk_order_uuid (order_uuid)
);
-- 内部用 BIGINT 顺序主键，外部 API 暴露 UUID
```

### FAIL: 字符集裸写 utf8

```sql
CREATE TABLE posts (content VARCHAR(1000)) DEFAULT CHARSET=utf8;
INSERT INTO posts VALUES ('表情符号 😀');  -- ERROR: Incorrect string value
-- "utf8" 实际是 utf8mb3，最多 3 字节，不能存 emoji 和部分中日韩字符
```

### PASS: 显式 utf8mb4

```sql
CREATE TABLE posts (
    content VARCHAR(1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- 完整 4 字节 UTF-8 支持，emoji/罕见字符正常存储
```
