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
