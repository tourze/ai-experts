# 错误创建方式选择

## 决策速查

| 场景 | 方式 | 调用方匹配 |
|------|------|-----------|
| 纯文本、无动态字段、需要 `errors.Is` 匹配 | `errors.New`（sentinel） | `errors.Is` |
| 需要格式化文本，不暴露类型 | `fmt.Errorf`（不带 `%w`） | 字符串匹配（不推荐） |
| 需要格式化文本并保留根因 | `fmt.Errorf("context: %w", err)` | `errors.Is` / `errors.As` |
| 需要携带结构化字段 | 自定义错误类型 | `errors.As` |
| 聚合多个错误 | `errors.Join`（Go 1.20+） | `errors.Is` / `errors.As` 逐一匹配 |
| 不想让调用方依赖具体类型 | Opaque error（返回 `error` 接口） | 只能用 `errors.Is` |

## errors.New — Sentinel Error

Sentinel 是包级别的稳定错误变量，用于表达固定的错误类别。

```go
var ErrNotFound = errors.New("user: not found")

func Find(id string) (*User, error) {
    u, ok := db[id]
    if !ok {
        return nil, ErrNotFound
    }
    return u, nil
}

// 调用方
user, err := userRepo.Find("abc")
if errors.Is(err, user.ErrNotFound) {
    // 处理不存在
}
```

**要点**：不要往 sentinel 里塞动态值（如 `fmt.Sprintf` 拼路径），否则每次都是新实例，`errors.Is` 永远为 false。

## fmt.Errorf — 格式化错误

当你只需要添加上下文文本，不需要暴露类型给调用方时使用。

```go
func LoadConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config %q: %w", path, err)
    }
    return data, nil
}
```

注意 `%w` 和 `%v` 的区别：`%w` 保留错误链供 `errors.Is`/`errors.As` 遍历，`%v` 会吞掉根因。

## 自定义错误类型

当调用方需要从错误中提取结构化字段时使用。必须实现 `error` 接口（即 `Error() string`）。

```go
type ValidationError struct {
    Field string
    Rule  string
}

func (e ValidationError) Error() string {
    return "validation: field " + e.Field + " violated " + e.Rule
}

// 调用方提取
var ve ValidationError
if errors.As(err, &ve) {
    log.Printf("field=%s rule=%s", ve.Field, ve.Rule)
}
```

**要点**：如果还需保留根因，额外实现 `Unwrap() error`。

## errors.Join — 聚合多个错误（Go 1.20+）

一次操作可能产生多个独立错误（如批量校验、并行任务）时使用。所有输入为 nil 时返回 nil。

```go
func validateAll(fields map[string]string) error {
    var errs error
    for name, val := range fields {
        if err := validate(name, val); err != nil {
            errs = errors.Join(errs, err)
        }
    }
    return errs
}

// errors.Is 会遍历 Join 内部的每个错误
err := validateAll(inputs)
if errors.Is(err, ErrEmptyField) { /* 处理空字段 */ }
if errors.Is(err, ErrInvalidFormat) { /* 处理格式错误 */ }
```

**要点**：`errors.Join` 内部实现了 `Unwrap() []error`，`errors.Is` 和 `errors.As` 自动遍历。

## Opaque Error — 不暴露类型

当包不想让调用方依赖具体错误类型时，只返回 `error` 接口，通过 sentinel 值或行为区分。

```go
package store

var ErrConflict = errors.New("store: version conflict")

func Update(item Item) error {
    if !cas(item) {
        return ErrConflict
    }
    return nil
}
```

调用方只能用 `errors.Is(err, ErrConflict)` 判断，无法 `errors.As` 提取更多字段。

**适用场景**：包的 API 边界、跨模块接口，避免暴露内部实现细节。之后如果需要携带更多信息，可以升级为自定义类型而不破坏 `errors.Is` 兼容性。
