# 事务与锁模式详解

## 典型死锁场景

```sql
-- 事务 A                           事务 B
-- BEGIN;                           BEGIN;
-- UPDATE accounts SET balance =    UPDATE accounts SET balance =
--   balance - 100                    balance - 50
--   WHERE id = 1;    -- 锁定 id=1    WHERE id = 2;    -- 锁定 id=2
-- UPDATE accounts SET balance =    UPDATE accounts SET balance =
--   balance + 100                    balance + 50
--   WHERE id = 2;    -- 等待 id=2    WHERE id = 1;    -- 等待 id=1 → 死锁!

-- 解决方案：固定加锁顺序，始终按 id 升序锁定
```

## SHOW ENGINE INNODB STATUS 死锁日志解读

```
*** (1) TRANSACTION:
TRANSACTION 421923, ACTIVE 0 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 3 lock struct(s), heap size 1136, 2 row lock(s)
UPDATE accounts SET balance = balance + 100 WHERE id = 2

*** (1) HOLDS THE LOCK(S):
RECORD LOCKS space id 58 page no 4 n bits 72 index PRIMARY
  of table `mydb`.`accounts` trx id 421923 lock_mode X locks rec but not gap
  → 事务 1 持有 id=1 的行排他锁

*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 58 page no 4 n bits 72 index PRIMARY
  → 事务 1 等待 id=2 的行排他锁

*** (2) TRANSACTION: （类似结构，持有 id=2，等待 id=1）

*** WE ROLL BACK TRANSACTION (2)
  → InnoDB 回滚了代价较小的事务 2
```

定位步骤：
1. 找到两个事务分别 HOLDS 和 WAITING FOR 的锁
2. 确认锁定的表、索引和 lock_mode（X = 排他, S = 共享, gap = 间隙锁）
3. 根据加锁顺序判断是否可以统一排序

## 间隙锁与 Next-Key Lock

```sql
-- 在 REPEATABLE READ 下，范围查询加 Next-Key Lock（行锁 + 前一个间隙锁）
-- 假设 orders 表 status 列有索引，现有 status 值为 1, 3, 5

START TRANSACTION;
SELECT * FROM orders WHERE status = 3 FOR UPDATE;
-- 锁定范围：(1, 3] 的 Next-Key Lock + (3, 5) 的间隙锁
-- 其他事务无法在 status = 2, 3, 4 处插入新行

-- 切换到 READ COMMITTED 消除间隙锁：
-- SET SESSION transaction_isolation = 'READ-COMMITTED';
-- 此时只锁定 status = 3 的行，不锁间隙
```

## FOR UPDATE vs FOR SHARE

| 锁类型 | 语法 | 互斥 | 适用场景 |
|--------|------|------|----------|
| 排他锁 | `SELECT ... FOR UPDATE` | 与 X 锁和 S 锁均互斥 | 读取后需要修改（扣库存、转账） |
| 共享锁 | `SELECT ... FOR SHARE` | 与 X 锁互斥，S 锁之间共享 | 读取后只验证不修改（检查外键是否存在） |

注意：如果先 `FOR SHARE` 再升级为 `FOR UPDATE`，两个事务同时持有 S 锁再同时请求 X 锁会死锁。确定要修改时直接用 `FOR UPDATE`。
