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
