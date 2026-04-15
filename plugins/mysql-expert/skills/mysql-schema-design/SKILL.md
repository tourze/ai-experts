---
name: mysql-schema-design
description: "设计和审查 MySQL 8.x 表结构、列类型、字符集、引擎选择与主键策略，适用于 OLTP 业务建模"
---

# MySQL Schema Design

## 适用场景

- 新建或变更业务表，需要确定列类型、主键策略、字符集与存储引擎。
- 审查 CREATE TABLE 语句的类型精度、约束完整性和默认值合理性。
- OLTP 数据建模中需要在范式化与查询性能之间取舍。
- 需要为索引打好列基础，联动 [mysql-index-strategy](../mysql-index-strategy/SKILL.md)。
- 表含稀疏或半结构化属性，需判断是否用 JSON 列，联动 [mysql-json-generated-columns](../mysql-json-generated-columns/SKILL.md)。

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

- 更多反例与 ENUM/DATETIME/TIMESTAMP 选型对比见 [references/type-selection.md](references/type-selection.md)。

## 检查清单

- 主键是否 `BIGINT UNSIGNED AUTO_INCREMENT`，是否避免了复合主键和 UUID 聚簇索引。
- 金额列是否 `DECIMAL`，精度位数是否满足业务上限。
- 字符集是否 `utf8mb4`，排序规则是否合理。
- 非空列是否显式 `NOT NULL DEFAULT`，可空列是否确实有业务语义。
- 表定义是否包含 `ENGINE`、`CHARSET`、`COLLATE` 和 `COMMENT`。

## 反模式

- 所有字符串列统一 `VARCHAR(255)`：浪费索引前缀空间，内存临时表按最大长度分配。
- 用 `FLOAT`/`DOUBLE` 存金额：`0.1 + 0.2 != 0.3`，财务对账出现分差。
- UUID 存为 `CHAR(36)` 做主键：随机值导致聚簇索引页分裂，写入性能下降 3-5 倍。
- 用 `ENUM` 管理状态：追加新值需 `ALTER TABLE`，内部排序违反直觉。
- 建表不指定 `ENGINE` 和 `CHARSET`：依赖服务器默认值，跨环境迁移时产生隐式转换。
