---
name: mysql-transaction-locking
description: "当用户要诊断或优化 MySQL InnoDB 事务隔离、行锁、间隙锁或死锁时使用。适用于并发冲突排查。"
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

### FAIL: 事务中调远程 API

```python
with db.transaction():
    order = db.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", id)
    payment_result = stripe.charge(order.amount)  # 网络调用 2-30 秒
    db.execute("UPDATE orders SET status = ? WHERE id = ?", payment_result, id)
# 锁持有 30 秒 → 同 user 其他订单全部 lock wait timeout
```

### PASS: 短事务 + 状态机

```python
# Phase 1: 短事务标记 processing
with db.transaction():
    affected = db.execute(
        "UPDATE orders SET status='processing' WHERE id=? AND status='pending'", id)
    if affected == 0: return "already processing"

# Phase 2: 锁外调用外部
payment_result = stripe.charge(order.amount)

# Phase 3: 短事务写结果
with db.transaction():
    db.execute("UPDATE orders SET status=? WHERE id=?", payment_result, id)
```

### FAIL: FOR UPDATE 未命中索引

```sql
-- order_no 未建索引
START TRANSACTION;
SELECT * FROM orders WHERE order_no = 'ORD-12345' FOR UPDATE;
-- InnoDB 全表扫描并锁定每一行，并发 100 个不同 order_no 的请求全部串行
```

### PASS: 走索引 + 限定行

```sql
CREATE UNIQUE INDEX idx_order_no ON orders (order_no);
START TRANSACTION;
SELECT * FROM orders WHERE order_no = 'ORD-12345' FOR UPDATE;
-- ref 查找精确锁定一行，不影响其他 order_no
```

### FAIL: 死锁直接报错

```python
try:
    with db.transaction():
        transfer(from_id, to_id, amount)
except MySQLError as e:
    if e.errno == 1213:
        return {"error": "系统繁忙"}  # 用户必须手动重试
```

### PASS: 自动重试

```python
for attempt in range(3):
    try:
        with db.transaction():
            transfer(from_id, to_id, amount)
        return {"ok": True}
    except MySQLError as e:
        if e.errno == 1213 and attempt < 2:
            time.sleep(0.05 * 2**attempt)  # 指数退避
            continue
        raise
```
