---
name: pgsql-index-strategy
description: "当用户要设计或审查 PostgreSQL B-tree、GIN、GiST、部分索引或表达式索引时使用。"
---

# PostgreSQL Index Strategy

## 适用场景

- 为新表或慢查询设计索引，需要在 B-tree、GIN、GiST 之间做选择
- 使用部分索引（`WHERE`）减少索引体积、提升写入性能
- 使用表达式索引或覆盖索引（`INCLUDE`）优化特定查询路径
- 通过 `EXPLAIN ANALYZE` 验证索引命中，或用 `pg_stat_user_indexes` 清理未使用索引
- 联动 [sql-optimization](./sql-optimization.md)；表结构及 JSONB 列设计参见 [db-schema-design](../../db-schema-design/SKILL.md)

## 核心约束

- 索引类型匹配运算符：B-tree 用于 `=`/`<`/`>`/`BETWEEN`/`ORDER BY`；GIN 用于 `@>`/`?`/`&&`/全文；GiST 用于范围重叠、几何包含
- 部分索引的 `WHERE` 必须与查询 `WHERE` 一致或为其超集，否则 planner 无法使用
- 覆盖索引 `INCLUDE` 只放小尺寸标量，不塞 TEXT/JSONB 大列
- 新增索引后必须用 `EXPLAIN (ANALYZE, BUFFERS)` 验证实际使用情况
- 定期检查 `pg_stat_user_indexes.idx_scan = 0` 清理未使用索引

## 代码模式

详细示例参见 [code-patterns.md](./code-patterns.md)。核心模板：

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

### FAIL: JSONB 上建 B-tree

```sql
CREATE INDEX idx_attrs ON product (attributes);  -- B-tree on JSONB
SELECT * FROM product WHERE attributes @> '{"color":"red"}';
-- planner 忽略此索引 → Seq Scan
```

### PASS: GIN + 匹配的 operator class

```sql
CREATE INDEX idx_attrs ON product USING gin (attributes jsonb_path_ops);
EXPLAIN ANALYZE SELECT * FROM product WHERE attributes @> '{"color":"red"}';
-- → Bitmap Index Scan on idx_attrs，毫秒级
```

### FAIL: 部分索引 WHERE 不匹配查询

```sql
CREATE INDEX idx_active ON purchase_order (created_at)
    WHERE status = 'active';

SELECT * FROM purchase_order
    WHERE status NOT IN ('completed','cancelled')
    ORDER BY created_at;
-- planner 无法证明 status NOT IN (...) ⊆ status='active'，索引白建
```

### PASS: WHERE 严格一致

```sql
CREATE INDEX idx_open ON purchase_order (created_at)
    WHERE status NOT IN ('completed','cancelled');
SELECT ... WHERE status NOT IN ('completed','cancelled') ORDER BY created_at;
-- 索引命中
```

### FAIL: 凭感觉建索引

```sql
CREATE INDEX idx_a ON t (col_a);
CREATE INDEX idx_b ON t (col_b);
CREATE INDEX idx_c ON t (col_c);
-- "应该会快"，没跑 EXPLAIN
-- 实际 planner 选 Seq Scan，因为表太小或选择性差
```

### PASS: EXPLAIN ANALYZE 验证

```sql
CREATE INDEX CONCURRENTLY idx_test ON t (col_a, col_b);
EXPLAIN (ANALYZE, BUFFERS) SELECT ... WHERE col_a = $1 AND col_b = $2;
-- 确认 Index Scan + buffers shared hit 而非 Seq Scan
-- 1 周后看 pg_stat_user_indexes.idx_scan，无使用就 DROP
```
