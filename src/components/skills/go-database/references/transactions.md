# 事务模式与隔离级别

## 1. 读写事务标准模式

`BeginTx` 后立即 `defer tx.Rollback()`。提交成功后 Rollback 为 no-op；中途返回都会触发回滚。

```go
func (r *userRepo) TransferBalance(ctx context.Context, from, to string, amount int) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }
    defer tx.Rollback()

    if _, err := tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance - ? WHERE id = ?", amount, from,
    ); err != nil {
        return fmt.Errorf("debit: %w", err)
    }
    if _, err := tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance + ? WHERE id = ?", amount, to,
    ); err != nil {
        return fmt.Errorf("credit: %w", err)
    }
    return tx.Commit()
}
```

## 2. 只读事务与隔离级别

通过 `sql.TxOptions` 控制。只读事务降低锁竞争（PostgreSQL 优化路径）；MySQL 忽略 `ReadOnly`。

```go
tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
    Isolation: sql.LevelSerializable,
    ReadOnly:  true,
})
```

常用隔离级别：

| 级别 | 适用场景 | 注意 |
|------|----------|------|
| Read Committed（默认） | 大多数业务读写 | 可能不可重复读 |
| Repeatable Read | 需要同一事务内一致快照 | MySQL InnoDB 默认 |
| Serializable | 金融/库存等强一致场景 | 性能开销大，可能死锁 |

原则：从默认开始，遇真实一致性问题时再提升。

## 3. 乐观锁

使用 version 列实现无锁并发控制。`RowsAffected == 0` 表示冲突，调用方决定重试或返回错误。

```go
func (r *orderRepo) UpdateWithVersion(ctx context.Context, o *Order) error {
    result, err := r.db.ExecContext(ctx,
        "UPDATE orders SET status = ?, version = version + 1 WHERE id = ? AND version = ?",
        o.Status, o.ID, o.Version,
    )
    if err != nil {
        return fmt.Errorf("update order: %w", err)
    }
    n, _ := result.RowsAffected()
    if n == 0 {
        return ErrConflict
    }
    o.Version++
    return nil
}
```

调用方配合指数退避重试（最多 3 次），退避间隔 `100ms * 2^i`。

## 4. 批量插入

使用多行 VALUES 代替循环单条 INSERT。大批量应分批提交（每 500 条），避免单事务过大。

```go
func batchInsert(ctx context.Context, db *sql.DB, users []User) error {
    if len(users) == 0 {
        return nil
    }
    placeholders := make([]string, len(users))
    args := make([]any, 0, len(users)*3)
    for i, u := range users {
        placeholders[i] = "(?, ?, ?)"
        args = append(args, u.ID, u.Name, u.Email)
    }
    query := "INSERT INTO users (id, name, email) VALUES " + strings.Join(placeholders, ",")
    _, err := db.ExecContext(ctx, query, args...)
    return err
}
```

万级以上数据量考虑数据库特有接口：MySQL `LOAD DATA`、PostgreSQL `pgx.Batch`。
## 5. Context 超时

事务继承 context 超时。超时后驱动取消语句并回滚事务。

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
tx, err := db.BeginTx(ctx, nil)
```

要点：
- 超时预算覆盖整个事务，不是单条语句。
- 事务中避免外部 HTTP 调用，耗时不可控。
- 超时后检查 `ctx.Err()` 区分超时与业务错误。

## 检查清单

| 要点 | 检查方式 |
|------|----------|
| defer Rollback | BeginTx 后紧跟 defer tx.Rollback() |
| Context 传入 | 用 BeginTx(ctx, nil)，不用 db.Begin() |
| 超时覆盖范围 | WithTimeout 在 BeginTx 外层设置 |
| 无外部调用 | grep 事务函数内 http.Get / rpc.Call |
| 批量分批 | 检查 VALUES 数量或批次大小 |
| 乐观锁冲突 | RowsAffected == 0 时返回明确错误 |
