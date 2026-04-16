---
name: mysql-json-generated-columns
description: "当用户要在 MySQL 中使用 JSON 列、虚拟列或存储生成列做稀疏属性建模与索引化时使用。"
---

# MySQL JSON & Generated Columns

## 适用场景

- 表中有稀疏或可变结构数据（商品扩展属性、用户偏好、第三方载荷），需判断用 JSON 列还是范式化。
- 对 JSON 内部字段建索引以支持查询过滤，使用虚拟/存储生成列配合索引。
- 用 `JSON_TABLE` 将 JSON 数组展开为关系行进行报表或联表查询。
- 与表结构联动，确定哪些数据适合 JSON、哪些应保持关系列，联动 [mysql-schema-design](../mysql-schema-design/SKILL.md)。
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

- 多值索引、JSON_TABLE 展开、`->>`/`JSON_CONTAINS`/`JSON_OVERLAPS` 用法见 [references/json-patterns.md](references/json-patterns.md)。

## 检查清单

- JSON 中高频查询字段是否已提取为生成列并建索引，是否存在直接在 JSON 表达式上做 WHERE 的慢查询。
- 生成列类型选择是否合理：读多写少用 VIRTUAL，需要覆盖索引或排序用 STORED。
- JSON 文档平均大小是否可控（建议 < 10KB），大文档是否该拆分到对象存储。
- 是否使用 `->>` 而非 `->`，避免字符串比较时引号不匹配。
- 是否评估过 JSON 数组的多值索引（8.0.17+），避免不必要的生成列。

## 反模式

- 将所有属性都塞进 JSON 放弃范式化：JOIN、外键、唯一性校验全部失效。
- 直接在 JSON 表达式上做 WHERE 不建生成列索引：只能全表扫描。
- 认为 `JSON_SET` 是原地修改：partial update 仅减少 binlog 大小，行存储层仍重写整个文档。
- 对 JSON 数组做 `JSON_CONTAINS` 而没有多值索引：每行做数组遍历，行数多时极慢。
- 虚拟列和存储列不区分场景混用：过滤用 STORED 浪费磁盘，覆盖索引用 VIRTUAL 则无法命中。
