# 事务与锁模式详解

## 锁类型速查

| 锁类型 | 层级 | 关键语义 | 诊断信号 |
|--------|------|----------|----------|
| `S` / `X` | 行或表 | 共享锁可并存，排他锁与共享/排他互斥 | `lock_mode S` / `lock_mode X` |
| `IS` / `IX` | 表 | 标记事务准备在表内某些记录上加共享/排他锁，让表锁快速判断是否兼容 | `TABLE LOCK ... lock mode IS/IX` |
| Record Lock | 索引记录 | 锁住已经存在的索引记录；InnoDB 行锁实际落在索引记录上 | `locks rec but not gap` |
| Gap Lock | 索引间隙 | 锁住两个索引记录之间的插入位置，用于阻止幻读；gap lock 之间通常不互斥 | `locks gap before rec` |
| Next-Key Lock | 索引记录 + 前一段间隙 | 前开后闭区间，例如 `(10, 11]`；REPEATABLE READ 下范围扫描常见 | 同时影响记录和前一段 gap |
| Insert Intention Lock | 间隙等待 | `INSERT` 在真正插入前声明插入意图；插入不同位置时可并行 | `insert intention waiting` |
| `AUTO-INC` Lock | 表 | 为 `AUTO_INCREMENT` 分配值服务，锁模式受 `innodb_autoinc_lock_mode` 控制 | 等待自增值分配或批量插入串行 |
| Predicate Lock | 空间索引 | 空间索引没有一维“下一个 key”，InnoDB 用 MBR 谓词锁保护匹配范围 | 空间索引 + MBR 查询条件 |

注意：MDL（Metadata Lock）属于 server 层元数据锁，不是 InnoDB 行锁；DDL 阻塞、`Waiting for table metadata lock` 要按元数据锁链路排查。

## 版本与隔离级别边界

- MySQL 8.x 默认隔离级别仍是 REPEATABLE READ，锁定读和写语句会按索引扫描路径加记录锁、gap lock 或 next-key lock。
- READ COMMITTED 会禁用搜索和索引扫描中的 gap locking，但外键约束检查和重复键检查仍保留 gap locking。
- 唯一索引等值命中唯一记录时通常只锁该索引记录；非唯一索引、范围条件、未命中记录和全索引扫描更容易放大锁范围。
- MySQL 8.0 默认 `innodb_autoinc_lock_mode=2`（interleaved）；MySQL 5.7 默认 `1`（consecutive）。使用 statement-based replication 时，不要用 `2`。

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
-- 此时搜索/索引扫描不再使用 gap locking，但外键约束检查和重复键检查仍可能加 gap lock
```

锁范围判断优先顺序：
1. 先看执行计划实际走哪个索引；锁的是扫描到的索引记录，不是 SQL 文本里看起来“应该命中”的列。
2. 再看条件是否唯一等值命中；唯一命中通常是 record lock，范围/非唯一/未命中更容易变成 next-key 或 gap。
3. 最后看隔离级别和语句类型；普通一致性读不加行锁，`FOR UPDATE` / `FOR SHARE` / `UPDATE` / `DELETE` 是锁定读或写。

## FOR UPDATE vs FOR SHARE

| 锁类型 | 语法 | 互斥 | 适用场景 |
|--------|------|------|----------|
| 排他锁 | `SELECT ... FOR UPDATE` | 与 X 锁和 S 锁均互斥 | 读取后需要修改（扣库存、转账） |
| 共享锁 | `SELECT ... FOR SHARE` | 与 X 锁互斥，S 锁之间共享 | 读取后只验证不修改（检查外键是否存在） |

MySQL 5.7 和旧代码里常见的 `SELECT ... LOCK IN SHARE MODE` 等价于共享锁定读；MySQL 8.0 推荐写 `FOR SHARE`。

注意：如果先 `FOR SHARE` 再升级为 `FOR UPDATE`，两个事务同时持有 S 锁再同时请求 X 锁会死锁。确定要修改时直接用 `FOR UPDATE`。

## AUTO_INCREMENT 锁模式

| `innodb_autoinc_lock_mode` | 名称 | 行为 | 适用边界 |
|----------------------------|------|------|----------|
| `0` | traditional | 所有 insert-like 语句都拿表级 `AUTO-INC` 锁到语句结束 | 兼容旧行为，吞吐最低 |
| `1` | consecutive | 简单插入用轻量 mutex，批量插入仍用 `AUTO-INC` 锁 | MySQL 5.7 默认；statement-based replication 安全 |
| `2` | interleaved | 不使用表级 `AUTO-INC` 锁，多个插入语句可交错分配自增值 | MySQL 8.0 默认；吞吐最高，但 statement-based replication 不安全 |

自增值分配后不会随事务回滚而回收。不要把自增列连续无空洞作为业务不变量。

## 常用观测入口

```sql
SHOW ENGINE INNODB STATUS\G

SELECT *
FROM performance_schema.data_locks\G

SELECT *
FROM performance_schema.data_lock_waits\G
```

读锁等待时先把 `ENGINE_TRANSACTION_ID`、`OBJECT_SCHEMA`、`OBJECT_NAME`、`INDEX_NAME`、`LOCK_TYPE`、`LOCK_MODE`、`LOCK_DATA` 拼起来看；只看 SQL 文本容易漏掉真实扫描索引和 gap 范围。

## 参考来源

- MySQL 8.0 Reference Manual: InnoDB Locking — https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html
- MySQL 8.0 Reference Manual: AUTO_INCREMENT Handling in InnoDB — https://dev.mysql.com/doc/refman/8.0/en/innodb-auto-increment-handling.html
