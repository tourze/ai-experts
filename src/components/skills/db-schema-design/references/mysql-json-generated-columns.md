---
name: mysql-json-generated-columns
description: "当用户要在 MySQL 中使用 JSON 列、虚拟列或存储生成列做稀疏属性建模与索引化时使用。"
---

# MySQL JSON & Generated Columns

## 适用场景

- 表中有稀疏或可变结构数据（商品扩展属性、用户偏好、第三方载荷），需判断用 JSON 列还是范式化。
- 对 JSON 内部字段建索引以支持查询过滤，使用虚拟/存储生成列配合索引。
- 用 `JSON_TABLE` 将 JSON 数组展开为关系行进行报表或联表查询。
- 与表结构联动，确定哪些数据适合 JSON、哪些应保持关系列，联动 [mysql-schema-design](./mysql-schema-design.md)。
- 在 JSON 生成列上建索引时联动 [mysql-index-strategy](../mysql-index-strategy/SKILL.md) 确保索引有效。

## 核心约束

- JSON 列不能有默认值、不能做主键或唯一约束；每次局部修改都需完整重写整个文档。
- 高频过滤/排序字段必须提取为生成列并建索引；直接在 JSON 表达式上的 WHERE 无法使用普通索引。
- 虚拟列（VIRTUAL）不占磁盘但每次读取时计算；存储列（STORED）占磁盘但可用于覆盖索引——按读写比选择。
- 使用 `->>` 获取无引号文本值（等价于 `JSON_UNQUOTE(JSON_EXTRACT(...))`），避免比较时引号不匹配。
- JSON 数组场景优先评估多值索引（MySQL 8.0.17+），避免不必要的生成列。

## 代码模式

```sql
CREATE TABLE products (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    attrs      JSON         NOT NULL COMMENT '稀疏扩展属性',
    attr_color VARCHAR(50)  GENERATED ALWAYS AS (attrs->>'$.color') VIRTUAL,
    weight_kg  DECIMAL(8,2) GENERATED ALWAYS AS (CAST(attrs->>'$.weight_kg' AS DECIMAL(8,2))) STORED,
    KEY idx_color (attr_color),
    KEY idx_weight (weight_kg)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

- 多值索引、JSON_TABLE 展开、`->>`/`JSON_CONTAINS`/`JSON_OVERLAPS` 用法见 [references/json-patterns.md](./json-patterns.md)。

## 检查清单

- JSON 中高频查询字段是否已提取为生成列并建索引，是否存在直接在 JSON 表达式上做 WHERE 的慢查询。
- 生成列类型选择是否合理：读多写少用 VIRTUAL，需要覆盖索引或排序用 STORED。
- JSON 文档平均大小是否可控（建议 < 10KB），大文档是否该拆分到对象存储。
- 是否使用 `->>` 而非 `->`，避免字符串比较时引号不匹配。
- 是否评估过 JSON 数组的多值索引（8.0.17+），避免不必要的生成列。

## 反模式

### FAIL: 直接 WHERE JSON 表达式

```sql
SELECT * FROM products WHERE attrs->>'$.color' = 'red';
-- 每行解析 JSON，无索引可用，全表扫描
```

### PASS: 生成列 + 索引

```sql
ALTER TABLE products
  ADD COLUMN attr_color VARCHAR(50) GENERATED ALWAYS AS (attrs->>'$.color') VIRTUAL,
  ADD KEY idx_color (attr_color);
SELECT * FROM products WHERE attr_color = 'red';
-- EXPLAIN: ref type，命中索引
```

### FAIL: 全属性进 JSON 抛弃范式化

```sql
CREATE TABLE orders (
  id BIGINT,
  data JSON  -- {user_id, amount, status, ...}
);
-- 无法建 user_id 外键；amount 类型不可控；status 无 CHECK 约束
-- 每次查一个字段要 JSON_EXTRACT
```

### PASS: 关系列为主 + JSON 为辅

```sql
CREATE TABLE orders (
  id       BIGINT PRIMARY KEY,
  user_id  BIGINT NOT NULL,
  amount   DECIMAL(12,2) NOT NULL,
  status   TINYINT NOT NULL,
  metadata JSON NULL,  -- 稀疏的可变扩展字段
  FOREIGN KEY (user_id) REFERENCES users(id)
);
-- 核心字段享受约束和索引，扩展字段放 JSON
```

### FAIL: 所有生成列都 STORED

```sql
ALTER TABLE products
  ADD COLUMN attr_weight DECIMAL(8,2) GENERATED ALWAYS AS (...) STORED,
  ADD COLUMN attr_color VARCHAR(50) GENERATED ALWAYS AS (...) STORED;
-- 磁盘翻倍，更新 JSON 时所有 STORED 列重写
```

### PASS: VIRTUAL vs STORED 按场景

```sql
-- 用于 WHERE 过滤（少量读计算无所谓）→ VIRTUAL
attr_color VARCHAR(50) GENERATED ALWAYS AS (attrs->>'$.color') VIRTUAL
-- 用于覆盖索引或 ORDER BY（读取频繁）→ STORED
weight_kg DECIMAL(8,2) GENERATED ALWAYS AS (...) STORED
```
