---
name: sql-code-review
description: 当用户要审查 SQL 查询、迁移脚本、存储过程或 ORM 生成语句的安全性、正确性与运维风险时使用。
---

# SQL Code Review

## 适用场景

- 审查手写 SQL、迁移脚本、报表查询、存储过程、触发器和 ORM 生成语句。
- 排查 SQL 注入、权限过宽、误删误更新、联表错误、索引误用、迁移锁表风险等问题。
- 需要把安全、正确性、性能和可运维性拆开评估，而不是只盯单条慢 SQL。
- 如果主要矛盾是性能，联动 [sql-optimization](./sql-optimization.md)；如果 SQL 依赖具体数据库特性，联动对应数据库专项 skill（如 `mysql-transaction-locking`、`pgsql-row-level-security`、`pgsql-partitioning`）。

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
- 数据访问权限是否最小化：读操作只授 SELECT，写操作按表粒度授 INSERT/UPDATE/DELETE，禁止 `GRANT ALL`；批量更新和删除脚本使用独立凭证并限制影响行数（`LIMIT` 或 `WHERE` 主键范围）；管理脚本禁止复用应用账号。

## 反模式

### FAIL: 拼接 SQL 字符串

```python
query = f”SELECT * FROM users WHERE email = '{user_input}'”
# user_input = “' OR 1=1 --” → SQL 注入
```

### PASS: 参数化查询

```python
cursor.execute(“SELECT * FROM users WHERE email = %s”, (user_input,))
```

### FAIL: DISTINCT 掩盖错误连接

```sql
SELECT DISTINCT u.* FROM users u, orders o WHERE u.id = o.user_id;
-- 隐式笛卡尔积 + DISTINCT 掩盖重复行来源
```

### PASS: 显式连接 + 明确列

```sql
SELECT u.id, u.email
FROM users u
INNER JOIN orders o ON o.user_id = u.id;
-- 如果仍有重复，问题在数据而非查询，需要排查
```

- 迁移脚本没有分批、回滚方案、只读副本兼容性评估就上生产。
- 只审查询时间，不审权限、数据正确性和异常恢复路径。
