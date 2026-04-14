---
name: sql-code-review
description: 审查 SQL 的安全性、正确性、可维护性与运维风险，适用于查询、迁移、存储过程和 ORM 生成语句的评审
---

# SQL Code Review

## 适用场景

- 审查手写 SQL、迁移脚本、报表查询、存储过程、触发器和 ORM 生成语句。
- 排查 SQL 注入、权限过宽、误删误更新、联表错误、索引误用、迁移锁表风险等问题。
- 需要把安全、正确性、性能和可运维性拆开评估，而不是只盯单条慢 SQL。
- 如果主要矛盾是性能，联动 [sql-optimization](../sql-optimization/SKILL.md)；如果 SQL 依赖具体数据库特性，联动 [mysql-best-practices](../mysql-best-practices/SKILL.md) 或 [postgresql-table-design](../postgresql-table-design/SKILL.md)。

## 核心约束

- 先审安全边界，再看性能：带副作用的 SQL 一旦权限、条件或事务边界错了，跑得再快也没意义。
- 用户输入必须经驱动参数化；占位符语法随驱动变化，但原则是不拼接、不内联、不信任。
- 查询要显式列出返回列、连接条件和排序条件，避免把歧义留给默认行为。
- 迁移脚本必须评估锁、回填、回滚和灰度路径，不要把“能执行”误当成“能上线”。
- 评审要覆盖读写放大、权限模型、审计需求和异常恢复路径，而不是只看语法。

## 代码模式

```sql
-- 反例：用 DISTINCT 掩盖错误连接，同时在索引列上套函数
SELECT DISTINCT u.*
FROM users AS u, orders AS o
WHERE u.id = o.user_id
  AND YEAR(o.created_at) = 2024;

-- 正例：显式列、显式连接、范围过滤
SELECT u.id, u.email
FROM users AS u
INNER JOIN orders AS o ON o.user_id = u.id
WHERE o.created_at >= '2024-01-01'
  AND o.created_at < '2025-01-01';
```

```sql
-- 占位符语法按驱动调整，但原则是不把用户输入直接拼进 SQL 字符串
UPDATE orders
SET status = ?, updated_at = CURRENT_TIMESTAMP
WHERE order_id = ?;
```

```sql
-- 上线前验证引用完整性或迁移副作用
SELECT o.user_id
FROM orders AS o
LEFT JOIN users AS u ON u.id = o.user_id
WHERE u.id IS NULL;
```

## 检查清单

- 所有用户输入是否都经过参数化，危险 DDL / DML 是否有额外保护条件与审计方案。
- `JOIN`、`WHERE`、`GROUP BY`、`ORDER BY` 是否表达了真实业务意图，没有隐藏笛卡尔积或默认排序依赖。
- 语句是否显式选择列、明确事务边界，并避免把 `DISTINCT`、`SELECT *` 当补丁。
- 迁移是否评估了锁时间、回填节奏、幂等性、失败回滚和只读副本兼容性。
- 数据访问权限是否遵循最小权限原则，尤其是批量更新、删除和管理脚本。

## 反模式

- 在应用代码里拼接 SQL 字符串，再指望“输入已经转义过一次”能兜底。
- 用 `DISTINCT`、子查询嵌套或 ORM 黑盒来掩盖错误连接与重复行来源。
- 写 `UPDATE table SET ...` 却忘了关键条件，只能靠事务回滚或运气补救。
- 迁移脚本没有分批、没有回滚方案、没有只读副本兼容性评估，就直接上生产。
- 只审单条查询时间，不审权限、数据正确性和异常恢复路径。
