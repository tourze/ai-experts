---
name: pgsql-index-strategy
description: "设计和审查 PostgreSQL B-tree、GIN、GiST、部分索引与表达式索引，适用于查询路径覆盖"
---

# PostgreSQL Index Strategy

## 适用场景

- 为新表或慢查询设计索引，需要在 B-tree、GIN、GiST 之间做选择
- 使用部分索引（`WHERE`）减少索引体积、提升写入性能
- 使用表达式索引或覆盖索引（`INCLUDE`）优化特定查询路径
- 通过 `EXPLAIN ANALYZE` 验证索引命中，或用 `pg_stat_user_indexes` 清理未使用索引
- 联动 database-expert 的 `sql-optimization`；表结构参见 [pgsql-schema-design](../pgsql-schema-design/SKILL.md)；JSONB 索引参见 [pgsql-jsonb-patterns](../pgsql-jsonb-patterns/SKILL.md)

## 核心约束

- 索引类型匹配运算符：B-tree 用于 `=`/`<`/`>`/`BETWEEN`/`ORDER BY`；GIN 用于 `@>`/`?`/`&&`/全文；GiST 用于范围重叠、几何包含
- 部分索引的 `WHERE` 必须与查询 `WHERE` 一致或为其超集，否则 planner 无法使用
- 覆盖索引 `INCLUDE` 只放小尺寸标量，不塞 TEXT/JSONB 大列
- 新增索引后必须用 `EXPLAIN (ANALYZE, BUFFERS)` 验证实际使用情况
- 定期检查 `pg_stat_user_indexes.idx_scan = 0` 清理未使用索引

## 代码模式

详细示例参见 [references/code-patterns.md](./references/code-patterns.md)。核心模板：

```sql
-- 部分索引
CREATE INDEX idx_order_active ON purchase_order (status, created_at)
    WHERE status NOT IN ('completed', 'cancelled');

-- 表达式索引
CREATE UNIQUE INDEX idx_user_lower_email ON app_user (lower(email));

-- GIN 索引
CREATE INDEX idx_attrs ON product USING gin (attributes jsonb_path_ops);
```

## 检查清单

- 每个索引是否有对应的高频查询路径，能否用 `EXPLAIN ANALYZE` 证明被使用
- GIN operator class 是否正确（`jsonb_ops` 支持 `?`/`?|`/`?&`，`jsonb_path_ops` 只支持 `@>` 但更紧凑）
- 部分索引 `WHERE` 是否与业务查询过滤条件匹配
- `INCLUDE` 列是否只包含小尺寸标量
- 是否定期清理 `idx_scan = 0` 的索引

## 反模式

- 为每列建单列 B-tree — 写放大严重且 planner 很少做 BitmapAnd，应按查询组合建复合索引
- 在 JSONB 列上建 B-tree — 无法加速 `@>`/`?`，应用 GIN
- 部分索引 WHERE 与查询不匹配 — planner 忽略该索引，白建
- `INCLUDE` 放大列 — 索引膨胀反增 I/O
- 凭直觉判断索引有效不跑 `EXPLAIN ANALYZE` — 必须用执行计划验证
