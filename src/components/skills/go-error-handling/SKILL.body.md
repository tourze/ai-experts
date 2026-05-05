## Go 代码模式

### 保留错误链

```go
func LoadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config %q: %w", path, err)
    }
    cfg, err := parseConfig(data)
    if err != nil {
        return nil, fmt.Errorf("parse config %q: %w", path, err)
    }
    return cfg, nil
}
```

### 稳定错误合同

```go
var ErrNotFound = errors.New("user: not found")

func FindUser(id string) (*User, error) {
    user, ok := users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return user, nil
}

if errors.Is(err, ErrNotFound) {
    return http.StatusNotFound
}
```

### 自定义错误类型

```go
type ValidationError struct {
    Field string
}
func (e ValidationError) Error() string {
    return "validation: invalid " + e.Field
}
```

## 常见错误

| 错误 | 修复 |
|------|------|
| `%v` 吞掉错误链 | 用 `%w` 保留根因 |
| 用 `err.Error()` 字符串分支 | 用 `errors.Is` / `errors.As` |
| sentinel error 含动态值 | sentinel 只表达稳定类别 |
| 普通业务失败用 panic | panic 只用于不可恢复的编程错误 |
| 错误字符串大写或有句号 | 小写、无句号、带操作上下文 |

## 深度参考

- [error-creation.md](references/error-creation.md) — sentinel / 自定义类型 / errors.Join 选择
- [error-wrapping.md](references/error-wrapping.md) — %w 链、errors.Is/As、Unwrap
