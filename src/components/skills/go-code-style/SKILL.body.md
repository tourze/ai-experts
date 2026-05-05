## 代码模式

### 1. 早返回保持主路径清晰

```go
func Process(order Order) (Receipt, error) {
	if order.ID == "" {
		return Receipt{}, errors.New("order: empty id")
	}
	if len(order.Items) == 0 {
		return Receipt{}, errors.New("order: empty items")
	}

	total := order.Total()
	return Receipt{OrderID: order.ID, Total: total}, nil
}
```

### 2. 用领域对象替代参数列表膨胀

```go
type NotifyRequest struct {
	UserID   string
	Message  string
	Channel  string
	Priority int
}

func SendNotification(ctx context.Context, req NotifyRequest) error {
	if req.UserID == "" {
		return errors.New("notify: empty user id")
	}
	return nil
}
```

### 3. 复杂条件先命名

```go
isAdmin := user.Role == RoleAdmin
isOwner := resource.OwnerID == user.ID
isPublicMember := resource.Public && user.Verified

if isAdmin || isOwner || isPublicMember {
	return nil
}
```

## 检查清单

- 是否存在可以用早返回压平的 `else` / 深层嵌套？
- 是否有 5 个以上参数、重复参数组或应成为领域对象的配置集合？
- struct literal 是否使用命名字段？
- 成功返回的 slice/map 是否会给调用方暴露 `nil` 语义？
- 是否有仅因“未来可能复用”而导出的类型或函数？
- 是否跑了 `gofmt`、`go test ./...` 或项目既有验证命令？

## 反模式

### FAIL: 按提示保留深层嵌套

```go
if order.ID != "" {
	if len(order.Items) > 0 {
		return process(order)
	} else {
		return Receipt{}, errors.New("empty items")
	}
}
return Receipt{}, errors.New("empty id")
```

### PASS: 边界先返回

```go
if order.ID == "" {
	return Receipt{}, errors.New("order: empty id")
}
if len(order.Items) == 0 {
	return Receipt{}, errors.New("order: empty items")
}
return process(order)
```

### FAIL: 为了“可复用”导出内部细节

```go
type InternalTokenParser struct{}

func BuildInternalTokenParser() *InternalTokenParser {
	return &InternalTokenParser{}
}
```

### PASS: 先保持内部可变

```go
type tokenParser struct{}

func newTokenParser() *tokenParser {
	return &tokenParser{}
}
```

## 常见错误

| 错误 | 修复 |
|------|------|
| 深层嵌套 `if-else` | 错误/边界先返回，主路径保持浅缩进 |
| 5+ 个函数参数 | 收敛成配置结构体或领域对象 |
| struct literal 不命名字段 | 命名字段防止字段重排导致静默错位 |
| 成功返回 `nil` slice/map | 返回 `[]T{}` / `map[K]V{}` |
| 导出"将来可能复用"的类型 | 先不导出，有跨包需求时再导出 |

## 深度参考

- [documentation.md](references/documentation.md) — README/CHANGELOG/注释标准
```
