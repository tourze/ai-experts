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
