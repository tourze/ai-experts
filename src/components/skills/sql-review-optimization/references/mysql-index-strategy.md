---
name: mysql-index-strategy
description: "当用户要设计、审查或优化 MySQL 索引、复合索引顺序或解读 EXPLAIN 时使用。"
---

# MySQL Index Strategy

## 适用场景

- 为业务查询设计复合索引，需要确定列顺序和覆盖范围。
- 解读 EXPLAIN 输出，诊断全表扫描、文件排序、临时表等性能问题。
- 审查现有索引布局，合并冗余索引、删除无用索引、评估索引膨胀。
- 与表结构设计联动确保列类型适合索引，联动 [db-schema-design](../../db-schema-design/SKILL.md)。
- 慢查询调优中需要索引改进，联动 [sql-optimization](./sql-optimization.md)。

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

- 覆盖索引、前缀索引区分度评估和冗余索引检测查询见 [index-patterns.md](./index-patterns.md)。

## 检查清单

- 复合索引列顺序是否满足"等值 → 范围 → 排序"，是否避免了范围列后跟排序列的无效组合。
- 高频查询是否命中覆盖索引（EXPLAIN Extra 是否 `Using index`），是否有不必要的回表。
- 是否存在冗余索引（如同时有 `idx(a)` 和 `idx(a, b)`），是否有长期未使用的索引。
- 前缀索引区分度是否经过计算验证，是否了解其限制。
- 单表索引总数是否合理，写密集型表是否因索引过多导致写入延迟。

## 反模式

### FAIL: 单列索引 + index_merge

```sql
CREATE INDEX idx_user ON orders (user_id);
CREATE INDEX idx_status ON orders (status);
CREATE INDEX idx_created ON orders (created_at);

SELECT * FROM orders
WHERE user_id = 12345 AND status = 1 AND created_at >= '2025-03-01';
-- EXPLAIN: type=index_merge, Using intersect(idx_user,idx_status)
-- 三个索引各扫一次再求交集，比单个复合索引慢 5-10 倍
```

### PASS: 精准复合索引

```sql
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at);
-- 等值 → 等值 → 范围+排序，一次 ref 查找直接定位
-- EXPLAIN: type=ref, key=idx_user_status_created, Extra=Using index condition
```

### FAIL: 范围列后排序列

```sql
CREATE INDEX idx_created_status ON orders (created_at, status);
SELECT * FROM orders WHERE created_at >= '2025-03-01' ORDER BY status;
-- 范围列后的 status 无法用于排序，出现 Using filesort
```

### PASS: 排序列前置或单独覆盖

```sql
-- 如果是高频查询，按业务调整索引顺序
CREATE INDEX idx_status_created ON orders (status, created_at);
SELECT * FROM orders WHERE status = 1 AND created_at >= '2025-03-01';
-- 等值 status + 范围 created_at，符合最左前缀，无 filesort
```

### FAIL: 索引堆叠不清理

```sql
SHOW INDEX FROM users;
-- idx_email, idx_email_status, idx_email_status_created（前两个被第三个完全覆盖）
-- 写入要维护 3 个 B+Tree，性能下降但只有 idx_email_status_created 真正被用
```

### PASS: 定期 audit + 删冗余

```sql
-- 用 sys.schema_redundant_indexes 找冗余
SELECT * FROM sys.schema_redundant_indexes WHERE table_name = 'users';
-- 用 sys.schema_unused_indexes 找未使用
DROP INDEX idx_email ON users;  -- 被 idx_email_status 覆盖
DROP INDEX idx_email_status ON users;  -- 被 idx_email_status_created 覆盖
```
