# go-database

## 适用场景

- 编写 SQL 查询、事务块、连接池配置或数据库 migration 脚本。
- 选择扫描方式（`database/sql` 手动 Scan / sqlx / sqlc）或处理 NULLable 列。
- 设计 Repository 接口、实现 batch insert、乐观锁、读写分离。
- 排查连接泄漏、事务未提交/回滚、查询超时不生效等问题。
- SQL 注入防护详见 [go-security](../go-security/SKILL.md)；查询取消传播详见 [go-context-lifecycle](../go-concurrency-patterns/SKILL.md)。

## 核心约束

- 参数化查询：必须用 `?` 占位符，禁止字符串拼接 SQL。安全性细节见 go-security。
- Context 传播：所有数据库操作使用 `QueryContext`、`QueryRowContext`、`ExecContext`，不使用无 Context 版本。
- 事务模式：`db.BeginTx(ctx, nil)` + `defer tx.Rollback()` + 显式 `tx.Commit()`。
- NULLable 列：使用 `sql.NullString` / `sql.NullInt64` 或指针类型 `*string` / `*int64` 接收。
- 连接池：上线前必须配置 `SetMaxOpenConns`、`SetMaxIdleConns`、`SetConnMaxLifetime`。
- ORM 约束：复杂查询（多表 JOIN、子查询、窗口函数）不用 ORM，使用 query builder 或 raw SQL。
- Migration：使用 golang-migrate、goose 或 atlas（声明式），禁止手动 DDL 部署。

## 常见错误

| 错误 | 修复 |
|------|------|
| 字符串拼接 SQL | 用 `?` 占位符 + 参数化查询 |
| 使用 `db.Query()` / `db.Exec()` 无 Context 版本 | 改用 `QueryContext` / `ExecContext` |
| 事务中忘记 `defer tx.Rollback()` | Begin 后立即 defer Rollback，Commit 成功后 Rollback 为 no-op |
| NULL 列直接 Scan 到值类型 | 使用 `sql.NullString` 或指针 `*string` |
| 忽略 `sql.ErrNoRows` | 业务语义区分"不存在"与"查询失败" |
| 连接池未配置导致连接耗尽 | 上线前设置 MaxOpenConns / MaxIdleConns / ConnMaxLifetime |
| ORM 处理复杂查询产生 N+1 | 改用 raw SQL 或 query builder |
| Migration 手动执行 DDL | 使用 golang-migrate / goose 版本化管理 |

## Repository 模式

将数据访问隐藏在接口后，方便测试与替换实现。

```go
type UserRepo interface {
    GetByID(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, user *User) error
}

type userRepo struct {
    db *sql.DB
}

func (r *userRepo) GetByID(ctx context.Context, id string) (*User, error) {
    var u User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, name, email FROM users WHERE id = ?", id,
    ).Scan(&u.ID, &u.Name, &u.Email)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("user get by id: %w", err)
    }
    return &u, nil
}
```

## NULLable 扫描

```go
// 方式 1：sql.NullString
var name sql.NullString
row.Scan(&name)
if name.Valid {
    fmt.Println(name.String)
}

// 方式 2：指针类型（配合 sqlx 更方便）
var user struct {
    ID    string  `db:"id"`
    Email *string `db:"email"` // NULL → nil
}
```

## 连接池配置

```go
db.SetMaxOpenConns(25)                  // 最大打开连接数
db.SetMaxIdleConns(10)                  // 最大空闲连接数
db.SetConnMaxLifetime(5 * time.Minute)  // 连接最大存活时间
db.SetConnMaxIdleTime(1 * time.Minute)  // 空闲连接最大存活时间
```

## 深度参考

- [transactions.md](references/transactions.md) — 事务模式、隔离级别、乐观锁、批量插入、Context 超时
