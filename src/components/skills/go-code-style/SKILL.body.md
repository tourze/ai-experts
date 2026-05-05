## 适用场景

- 编写或审查 Go 代码时，需要判断“能跑”和“好维护”之间的差距。
- 需要处理长函数、深层嵌套、过长参数列表、导出面过大、命名字段缺失等可读性问题。
- 需要把 AI 生成的 Go 代码改成更接近工程惯例的版本。
- 需要命名或错误语义时配合 [go-error-handling](../go-error-handling/SKILL.md)；涉及 nil、slice、map 或资源安全时配合 [go-safety](../go-error-handling/SKILL.md)。

## 核心约束

- 先跑 `gofmt` / `go test` / 项目既有 lint，再讨论主观风格；格式问题交给工具。
- 错误和边界条件先返回，主路径保持浅缩进；不要用多层 `else` 包住正常逻辑。
- `context.Context` 放第一个参数；函数参数超过 4 个时优先收敛成配置结构体或领域对象。
- struct literal 默认使用命名字段，避免上游结构体字段调整导致静默错位。
- slice/map 返回空集合时使用 `[]T{}` / `map[K]V{}` 或 `make`，不要把成功路径表达成 `nil`。
- 最小化公开 API：没有跨包使用证据的类型、函数、字段默认不导出。

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
