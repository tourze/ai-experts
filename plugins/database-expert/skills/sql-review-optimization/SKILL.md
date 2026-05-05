---
name: sql-review-optimization
description: "当用户要审查 SQL 安全性、正确性与运维风险，或分析 slow query、EXPLAIN 执行计划、索引调优（含深度索引策略）、join order、分页策略时使用。"
---

# SQL Review & Optimization

## 适用场景

- 审查手写 SQL、迁移脚本、存储过程和 ORM 生成语句的安全性、正确性和可运维性。
- 排查 SQL 注入、权限过宽、误删误更新、联表错误、索引误用、迁移锁表风险。
- 排查慢查询、索引缺失、回表过多、排序退化、批处理低效、分页越来越慢等性能问题。
- 基于执行计划、行数估算、锁等待和数据分布决定优化方向。
- 深度索引设计：索引类型选择（B-tree / GIN / GiST / BRIN）、复合索引列顺序、EXPLAIN 解读与索引维护。
- 如果优化依赖具体数据库引擎特性，联动 [db-schema-design](../db-schema-design/SKILL.md)。

## 核心约束

### 审查（先安全，再性能）

- 先审安全边界，再看性能；权限、条件或事务边界错了跑再快也没意义。
- 用户输入必须经驱动参数化；不拼接、不内联。
- 查询要显式列出返回列、连接条件和排序条件。
- 迁移脚本必须评估锁、回填、回滚和灰度路径。
- 评审覆盖读写放大、权限模型、审计和异常恢复。

### 优化（先测量，再优化）

- 先拿执行计划、真实行数、延迟和资源消耗，再决定改 SQL 还是改索引。
- 优先修访问路径，再谈"技巧重写"；大多数慢查询输在过滤、排序和索引布局。
- 热路径分页优先游标或 seek，避免大偏移 OFFSET。
- 批处理、报表和在线请求资源模型不同，OLAP 查询不塞进 OLTP 热链路。
- 复合索引顺序匹配过滤和排序路径，不按"字段重要性"拍脑袋。

### 深度索引策略

通用原则与 MySQL/PostgreSQL 特化策略（B+Tree 聚簇索引、前缀索引、GIN/GiST/BRIN、部分索引、INCLUDE）见 [references/index-strategy.md](references/index-strategy.md) 与 [../db-index-strategy/references/](../db-index-strategy/references/) 下的参考文件。详细方法论见 [references/sql-code-review.md](references/sql-code-review.md)、[references/sql-optimization.md](references/sql-optimization.md)。

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
