# 错误包装与链式遍历

## 核心机制

`%w` 创建一个包含 `Unwrap() error` 的匿名错误类型，`errors.Is` / `errors.As` 沿 Unwrap 链逐层向下查找。

## %w 包装 — 保留根因

```go
func ReadUser(id string) (*User, error) {
    data, err := db.Query("SELECT * FROM users WHERE id = ?", id)
    if err != nil {
        return nil, fmt.Errorf("query user %s: %w", id, err)
    }
    return parse(data), nil
}
```

**限制**：单个 `fmt.Errorf` 只能包含一个 `%w`。多个错误用 `errors.Join`。

```go
// 编译错误：multiple %w in fmt.Errorf format string
fmt.Errorf("both failed: %w and %w", err1, err2)

// 正确做法
errors.Join(err1, err2)
```

## errors.Is — 匹配 Sentinel 值

沿 Unwrap 链逐层比较，找到与目标 sentinel 相等的错误即返回 true。

```go
var ErrNotFound = errors.New("user: not found")

func Handle(id string) error {
    _, err := FindUser(id)
    if err != nil {
        return fmt.Errorf("handle request: %w", err)
    }
    return nil
}

// 即使被包装了多层也能匹配
err := Handle("abc")
if errors.Is(err, ErrNotFound) {
    // errors.Is 沿 Unwrap 链找到 ErrNotFound
}
```

**使用 `==` 或 `Is() bool` 方法比较**，不要用 `err.Error()` 字符串判断。

## errors.As — 提取类型化错误

沿 Unwrap 链查找，将第一个可赋值到目标类型的错误填入目标指针。

```go
type TimeoutError struct {
    Duration time.Duration
}

func (e TimeoutError) Error() string {
    return fmt.Sprintf("timeout after %s", e.Duration)
}

// 调用方提取
var te TimeoutError
if errors.As(err, &te) {
    log.Printf("timed out after %s", te.Duration)
}
```

**必须传指针 `&te`**，不能传值。`errors.As` 沿整条链查找，不限于最外层。

## 自定义 Unwrap

### 单错误链（Unwrap() error）

```go
type withContext struct {
    msg string
    err error
}

func (e *withContext) Error() string { return e.msg + ": " + e.err.Error() }
func (e *withContext) Unwrap() error { return e.err }
```

`fmt.Errorf("...: %w", err)` 生成的就是这个模式。

### 多错误链（Unwrap() []error，Go 1.20+）

`errors.Join` 内部实现了这个接口：

```go
type joinError struct {
    errs []error
}

func (e *joinError) Error() string { /* 拼接所有错误文本 */ }
func (e *joinError) Unwrap() []error { return e.errs }
```

`errors.Is` 和 `errors.As` 会遍历 `[]error` 中的每个元素。

大多数场景下 `fmt.Errorf("%w")` 和 `errors.Join` 已经够用，只在需要携带额外字段或自定义匹配逻辑时才实现 `Unwrap`。

## 在哪里包装

**只在领域边界包装，不在每一层都包装。**

```go
// 存储层：返回原始错误或 sentinel，不包装
func (s *Store) Get(id string) (*User, error) {
    row := s.db.QueryRow("SELECT ...", id)
    var u User
    if err := row.Scan(&u.Name); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &u, nil
}

// 服务层（领域边界）：在这里添加业务上下文
func (svc *Service) GetUser(id string) (*User, error) {
    u, err := svc.store.Get(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return u, nil
}
```

内层返回稳定错误（sentinel / 自定义类型），外层在真正需要区分操作的边界才加 `%w` 包装。

## 常见错误速查

| 错误 | 修复 |
|------|------|
| 用 `%v` 代替 `%w` 包装 | 改成 `%w` 保留 Unwrap 链 |
| `fmt.Errorf` 里写多个 `%w` | 改用 `errors.Join` |
| `errors.As(err, te)` 传值 | 改成 `errors.As(err, &te)` 传指针 |
| 每层都 `fmt.Errorf("layer: %w", err)` | 只在领域边界包装 |
| 用 `err.Error()` 做包含判断 | 改成 `errors.Is` / `errors.As` |
