---
name: db-index-strategy
description: "当用户要设计、审查或优化数据库索引（MySQL B+Tree / PostgreSQL B-tree, GIN, GiST, BRIN）、复合索引顺序或解读 EXPLAIN 时使用。"
---

# Database Index Strategy

## 适用场景

- 为业务查询设计索引，需要选择索引类型和确定列顺序。
- 解读 EXPLAIN / EXPLAIN ANALYZE 输出，诊断全表扫描、文件排序、回表等性能问题。
- 审查现有索引布局，合并冗余索引、删除未使用索引、评估索引膨胀。
- 跨 DBMS 场景需要理解 MySQL 与 PostgreSQL 索引差异，选择适合的索引策略。
- 联动 [db-schema-design](../db-schema-design/SKILL.md) 确保列类型适合索引；联动 [sql-review-optimization](../sql-review-optimization/SKILL.md) 做慢查询调优。

## 核心约束

### 通用原则

- 复合索引列顺序遵循"等值 → 范围 → 排序"；范围条件之后的列无法被索引过滤。
- 覆盖索引避免回表；优先为高频查询设计覆盖索引。
- 单表索引控制在 5-7 个以内；每个索引增加写入时维护成本。
- 禁止在低基数列（性别、布尔值）上单独建索引；优化器可能拒绝使用。
- 新增索引后必须用 EXPLAIN 验证实际命中情况。

### MySQL 特化

- InnoDB 使用 B+Tree 聚簇索引；二级索引叶子存主键值，回表不可避免时建议覆盖索引。
- 前缀索引仅用于 TEXT/BLOB 或超长 VARCHAR；前缀索引无法用于 ORDER BY 和覆盖索引。
- 索引合并（index_merge）不如一个复合索引稳定；出现时优先评估复合索引替代。

### PostgreSQL 特化

- B-tree 用于 `=`/`<`/`>`/`BETWEEN`/`ORDER BY`；GIN 用于 `@>`/`?`/`&&`/全文搜索；GiST 用于范围重叠、几何包含；BRIN 用于大表按物理顺序的自然关联列。
- 部分索引的 `WHERE` 必须与查询 `WHERE` 一致或为其超集，否则 planner 无法使用。
- 覆盖索引 `INCLUDE` 只放小尺寸标量，不塞 TEXT/JSONB 大列。
- 定期检查 `pg_stat_user_indexes.idx_scan = 0` 清理未使用索引。

详细引擎专有模式见：[references/mysql-index-strategy.md](references/mysql-index-strategy.md)、[references/pgsql-index-strategy.md](references/pgsql-index-strategy.md)、[references/index-patterns.md](references/index-patterns.md)、[references/code-patterns.md](references/code-patterns.md)。

## 代码模式

```sql
-- MySQL：某用户最近 30 天已支付订单，按时间倒序
-- 索引：等值(user_id, status) → 范围+排序(created_at)
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at);

-- PostgreSQL：部分索引 + 覆盖列
CREATE INDEX idx_order_active ON purchase_order (status, created_at)
    INCLUDE (total_amount)
    WHERE status IN ('pending', 'confirmed');
```

## 检查清单

- 复合索引列顺序是否匹配查询的过滤 → 排序路径。
- EXPLAIN 输出中 type、key、Extra 是否达到预期（避免 ALL / filesort / temporary）。
- 是否存在低基数列上的孤立索引或未使用索引。
- 覆盖索引是否真的覆盖了查询所需全部列。
- PostgreSQL 专属：部分索引的 WHERE 是否与查询一致；GIN/GiST 索引是否匹配运算符。
- MySQL 专属：是否有前缀索引阻碍 ORDER BY 或覆盖索引的场景。

## 反模式

- 每个查询各建一个索引，导致索引数量膨胀和写入性能下降。
- 不读 EXPLAIN 就加索引，靠直觉而非执行计划决策。
- 在 TEXT/JSONB 大列上建普通索引而不是 GIN 或前缀索引。
- PostgreSQL 上用 B-tree 替代 GIN 处理 `@>` 等 JSONB 运算符。
