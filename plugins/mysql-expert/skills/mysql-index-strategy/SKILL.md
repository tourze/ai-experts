---
name: mysql-index-strategy
description: "当用户要设计、审查或优化 MySQL 索引布局、复合索引顺序、覆盖索引或解读 EXPLAIN 时使用。"
---

# MySQL Index Strategy

## 适用场景

- 为业务查询设计复合索引，需要确定列顺序和覆盖范围。
- 解读 EXPLAIN 输出，诊断全表扫描、文件排序、临时表等性能问题。
- 审查现有索引布局，合并冗余索引、删除无用索引、评估索引膨胀。
- 与表结构设计联动确保列类型适合索引，联动 [mysql-schema-design](../mysql-schema-design/SKILL.md)。
- 慢查询调优中需要索引改进，联动 database-expert 的 `sql-optimization`。

## 核心约束

- 复合索引列顺序遵循"等值 → 范围 → 排序"；范围条件之后的列无法被索引过滤。
- 覆盖索引避免回表，EXPLAIN Extra 出现 `Using index` 即命中；优先为高频查询设计覆盖索引。
- 单表索引控制在 5-7 个以内；每个索引增加写入时 B+Tree 维护成本。
- 前缀索引仅用于 TEXT/BLOB 或超长 VARCHAR；前缀索引无法用于 ORDER BY 和覆盖索引。
- 禁止在低基数列（性别、布尔值）上单独建索引；优化器可能拒绝使用。

## 代码模式

```sql
-- 查询：某用户最近 30 天已支付订单，按时间倒序
-- 索引：等值(user_id, status) → 范围+排序(created_at)
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at);
```

```sql
-- EXPLAIN 关键字段：type(ref/range/ALL)、key、rows、Extra(Using index/Using filesort)
EXPLAIN SELECT id, order_no FROM orders
WHERE user_id = 12345 AND status = 1 AND created_at >= '2025-03-01'
ORDER BY created_at DESC LIMIT 20;
```

- 覆盖索引、前缀索引区分度评估和冗余索引检测查询见 [references/index-patterns.md](references/index-patterns.md)。

## 检查清单

- 复合索引列顺序是否满足"等值 → 范围 → 排序"，是否避免了范围列后跟排序列的无效组合。
- 高频查询是否命中覆盖索引（EXPLAIN Extra 是否 `Using index`），是否有不必要的回表。
- 是否存在冗余索引（如同时有 `idx(a)` 和 `idx(a, b)`），是否有长期未使用的索引。
- 前缀索引区分度是否经过计算验证，是否了解其限制。
- 单表索引总数是否合理，写密集型表是否因索引过多导致写入延迟。

## 反模式

- 为每个 WHERE 条件单独建索引而不使用复合索引：index_merge 效率远低于精准复合索引。
- 复合索引列顺序按字母排列而非按查询模式排列：最左前缀未命中时索引完全无效。
- 在 `VARCHAR(255)` 上建完整索引却不评估前缀索引：索引页膨胀，B+Tree 层级增加。
- 盲目添加索引不删除旧索引：每次写操作都要维护所有索引的 B+Tree。
- 用 `FORCE INDEX` 绕过优化器而不分析根因：数据分布变化后可能适得其反。
