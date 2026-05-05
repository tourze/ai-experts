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
