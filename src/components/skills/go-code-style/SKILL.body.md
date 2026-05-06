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
