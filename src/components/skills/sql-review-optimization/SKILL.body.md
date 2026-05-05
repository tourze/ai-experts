## 代码模式

```sql
-- 反例：DISTINCT 掩盖错误连接 + 索引列套函数
SELECT DISTINCT u.* FROM users AS u, orders AS o
WHERE u.id = o.user_id AND YEAR(o.created_at) = 2024;

-- 正例：显式列、显式连接、范围过滤
SELECT u.id, u.email FROM users AS u
INNER JOIN orders AS o ON o.user_id = u.id
WHERE o.created_at >= '2024-01-01' AND o.created_at < '2025-01-01';

-- 反例：相关子查询反复扫描同类数据
SELECT p.product_id, p.price FROM products AS p
WHERE p.price > (SELECT AVG(p2.price) FROM products AS p2 WHERE p2.category_id = p.category_id);

-- 正例：窗口函数一次扫描
SELECT product_id, price FROM (
    SELECT product_id, price,
           AVG(price) OVER (PARTITION BY category_id) AS cat_avg
    FROM products
) sub WHERE price > cat_avg;

-- MySQL 索引：等值 → 范围+排序
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at);

-- PostgreSQL 部分索引 + 覆盖列
CREATE INDEX idx_order_active ON purchase_order (status, created_at)
    INCLUDE (total_amount) WHERE status IN ('pending', 'confirmed');
```

## 检查清单

### 审查

- 所有用户输入是否通过参数化绑定，是否存在拼接或内联。
- DELETE/UPDATE/DROP 是否有限制条件（WHERE/LIMIT）和事务边界。
- 迁移脚本是否评估了锁范围、回填策略和回滚路径。
- 查询是否显式列出列名、连接条件和排序条件。
- 权限模型是否满足最小权限原则。

### 优化

- 是否已获取 EXPLAIN / EXPLAIN ANALYZE 输出，type/key/Extra 是否达到预期。
- 执行计划是否出现全表扫描、文件排序、临时表或嵌套循环大表。
- 索引是否匹配 WHERE / JOIN / ORDER BY 的实际访问路径。
- 复合索引列顺序是否匹配查询的过滤 → 排序路径。
- 大偏移分页是否已改为游标/seek 分页。
- 批处理是否避免了逐行操作和 N+1 查询。
- PostgreSQL：部分索引 WHERE 是否与查询一致；GIN/GiST 是否匹配运算符。
- MySQL：前缀索引是否阻碍 ORDER BY 或覆盖索引场景。

## 反模式

- 不读执行计划就改 SQL 或加索引。
- 用 DISTINCT 掩盖错误的 JOIN 条件。
- 在 WHERE 的索引列上套函数导致索引失效。
- 把报表查询直接跑在 OLTP 主库上。
- SELECT * 并依赖列序号取数据。
- 用应用程序循环逐行处理而不是集合操作。
- 每个查询各建一个索引，导致索引膨胀和写入性能下降。
- 在 TEXT/JSONB 大列上建普通索引而不是 GIN 或前缀索引。
- PostgreSQL 上用 B-tree 替代 GIN 处理 `@>` 等运算符。
