---
name: sql-optimization
description: 优化 SQL 的访问路径、索引策略、分页和批处理表现，适用于慢查询分析、执行计划解读与容量增长场景
---

# SQL Optimization

## 适用场景

- 排查慢查询、索引缺失、回表过多、排序退化、批处理低效、分页越来越慢等问题。
- 需要基于执行计划、行数估算、锁等待和数据分布决定优化方向，而不是盲目重写 SQL。
- 调整 ORM 生成语句、报表 SQL、批量任务或高频接口的数据库访问路径。
- 如果主要问题是安全或正确性，联动 [sql-code-review](../sql-code-review/SKILL.md)；如果优化依赖数据库方言细节，联动 mysql-expert 或 pgsql-expert 的对应技能。

## 核心约束

- 先测量再优化：先拿到执行计划、真实行数、延迟和资源消耗，再决定改 SQL 还是改索引。
- 优先修访问路径，再谈“技巧重写”；大多数慢查询先输在过滤、排序和索引布局上。
- 复合索引顺序要匹配过滤和排序路径，不能只按“字段重要性”拍脑袋排列。
- 热路径分页优先游标或 seek 方法，避免大偏移 `OFFSET` 把扫描成本推高。
- 批处理、报表和在线请求的资源模型不同；不要把 OLAP 风格查询直接塞进 OLTP 热链路。

## 代码模式

```sql
-- 反例：相关子查询会反复扫描同类数据
SELECT p.product_id, p.price
FROM products AS p
WHERE p.price > (
    SELECT AVG(p2.price)
    FROM products AS p2
    WHERE p2.category_id = p.category_id
);

-- 正例：用窗口函数一次扫描完成分组统计
SELECT product_id, price
FROM (
    SELECT
        product_id,
        price,
        AVG(price) OVER (PARTITION BY category_id) AS avg_category_price
    FROM products
) AS ranked
WHERE price > avg_category_price;
```

```sql
CREATE INDEX orders_customer_created_idx
ON orders (customer_id, created_at DESC);
```

```sql
SELECT order_id, created_at, total_amount
FROM orders
WHERE customer_id = ?
  AND (created_at, order_id) < (?, ?)
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

## 检查清单

- 执行计划里是否出现全表扫描、错误驱动表、额外排序、回表过多或行数估算明显失真。
- 过滤条件、连接键、排序键和分页键是否与现有索引顺序一致。
- 能否通过改写为范围过滤、预聚合、窗口函数、批量写入或游标分页来减少扫描量。
- 热路径查询是否只取必要列，并避免把报表型宽查询塞进在线接口。
- 优化是否在真实数据量和并发条件下验证过，而不是只在空库或样例数据上“看起来更快”。

## 反模式

- 不看执行计划，先凭感觉把查询重写成更复杂的版本。
- 看到慢查询就叠索引，结果写放大、锁竞争和维护成本一起上升。
- 继续使用大偏移分页，然后把响应变慢归因于“数据库不行”。
- 相关子查询、`OR` 条件和函数过滤堆在热点路径里，却从不考虑访问路径。
- 用报表 SQL 直接服务线上接口，让单次请求拖垮事务库缓存和连接池。
