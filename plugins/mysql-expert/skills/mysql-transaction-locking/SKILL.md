---
name: mysql-transaction-locking
description: "诊断和优化 MySQL InnoDB 事务隔离、行锁、间隙锁与死锁，适用于并发冲突排查"
---

# MySQL Transaction & Locking

## 适用场景

- 排查死锁告警，需要读懂 `SHOW ENGINE INNODB STATUS` 并定位根因。
- 选择事务隔离级别，在 REPEATABLE READ 和 READ COMMITTED 之间做权衡。
- 分析高并发场景下的锁等待和锁超时，减少事务持有锁的时间。
- 正确使用 `SELECT ... FOR UPDATE` / `FOR SHARE`，避免丢失更新和幻读。
- 需要理解索引对锁范围的影响，联动 [mysql-index-strategy](../mysql-index-strategy/SKILL.md)。

## 核心约束

- InnoDB 默认 REPEATABLE READ，使用 Next-Key Lock（行锁 + 间隙锁），可能锁定比预期更大的范围。
- READ COMMITTED 只加行锁不加间隙锁，高并发写入场景锁冲突更少，但允许幻读；批量操作优先考虑 RC。
- 事务必须尽快提交或回滚；长事务持有锁阻塞其他会话，且阻止 undo log 清理导致 history list 膨胀。
- `SELECT ... FOR UPDATE` 必须在事务内且命中索引；无索引时退化为锁定全表。
- 应用层必须捕获 deadlock 错误（error 1213）并自动重试，InnoDB 会回滚代价较小的事务。

## 代码模式

```sql
-- 防死锁：固定加锁顺序，始终按 id 升序锁定
START TRANSACTION;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

```sql
-- 扣减库存防超卖：FOR UPDATE 加排他锁
START TRANSACTION;
SELECT stock FROM products WHERE id = 1001 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 1001;
COMMIT;
```

- 死锁日志解读、间隙锁/Next-Key Lock 分析和 INNODB STATUS 解析见 [references/locking-patterns.md](references/locking-patterns.md)。

## 检查清单

- 是否明确了当前隔离级别及其锁行为差异。
- 所有 `FOR UPDATE` 是否在显式事务内且 WHERE 命中索引。
- 事务是否保持短小，是否有事务超时保护。
- 应用层是否捕获死锁错误码（1213）并实现自动重试。
- 是否有定期检查 `SHOW ENGINE INNODB STATUS` 或 `performance_schema.data_locks` 的监控。

## 反模式

- 在事务中执行远程 API 调用或等待用户输入：持有锁期间阻塞其他会话，导致锁等待链式传播。
- `FOR UPDATE` 的 WHERE 未命中索引：InnoDB 锁定扫描的所有行，并发退化为串行。
- 忽略死锁错误不重试：error 1213 后直接返回失败，而不是短暂退避后重试 1-3 次。
- 所有场景都用 `FOR UPDATE` 不区分 `FOR SHARE`：读-读之间也互斥，不必要地降低并发度。
- 在 REPEATABLE READ 下做大范围扫描加锁：间隙锁覆盖范围远超预期，大量 INSERT 被阻塞。
