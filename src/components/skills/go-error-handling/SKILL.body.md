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
