
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
