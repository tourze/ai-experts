---
name: go-context-lifecycle
description: 当 Go 代码需要传递取消、超时、deadline 或 request-scoped value 时使用。
---

# go-context-lifecycle

## 适用场景

- 编写 HTTP handler、RPC client、数据库查询、后台任务、worker 或跨 goroutine 调用链。
- 需要修复取消不生效、请求超时后仍继续执行、goroutine 卡住、测试依赖真实时间等问题。
- 需要判断 `context.WithTimeout`、`context.WithCancel`、`context.WithValue` 的位置和生命周期。
- 涉及并发 fan-out / worker pool 时配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；涉及测试时间控制时配合 [go-testing-patterns](../go-testing-patterns/SKILL.md)。

## 核心约束

- `context.Context` 只作为第一个参数传递，不存进 struct，不设为全局变量。
- 创建带取消的 context 后必须 `defer cancel()`，释放 timer 和下游资源。
- 不在库函数里无故使用 `context.Background()`；库函数接收调用方传入的 context。
- 阻塞操作必须监听 `ctx.Done()`，包括 channel send/receive、select、HTTP request、DB query。
- `context.Value` 只放 request-scoped 元数据，如 trace id、auth principal；不要放可选参数或业务配置。
- 超时预算应在调用链入口或明确边界设置，下游不要随意放大 deadline。

## 代码模式

### 1. context 作为第一个参数传递

```go
func FetchUser(ctx context.Context, db *sql.DB, id string) (*User, error) {
	row := db.QueryRowContext(ctx, `select id, name from users where id = ?`, id)
	var user User
	if err := row.Scan(&user.ID, &user.Name); err != nil {
		return nil, fmt.Errorf("fetch user: %w", err)
	}
	return &user, nil
}
```

### 2. 阻塞 channel 操作监听取消

```go
func sendResult(ctx context.Context, ch chan<- Result, result Result) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case ch <- result:
		return nil
	}
}
```

### 3. 在边界设置超时预算

```go
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.service.Handle(ctx, r); err != nil {
		http.Error(w, "request failed", http.StatusInternalServerError)
	}
}
```

## 检查清单

- 函数是否把 `context.Context` 放在第一个参数？
- 是否有库函数偷偷创建 `context.Background()`，导致调用方无法取消？
- `WithTimeout` / `WithCancel` 后是否调用 `cancel()`？
- channel、锁等待、HTTP、DB、外部命令是否使用 context-aware API？
- `context.Value` 是否只承载请求级元数据，而不是业务配置？
- 测试是否覆盖取消、超时和 deadline 传播？

## 反模式

### FAIL: struct 保存 context

```go
type Service struct {
	ctx context.Context
}
```

### PASS: 调用时显式传入

```go
type Service struct{}

func (s *Service) Run(ctx context.Context) error {
	return nil
}
```

### FAIL: 下游断开取消链

```go
req, _ := http.NewRequest(http.MethodGet, url, nil)
```

### PASS: 绑定调用方 context

```go
req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
```

## 常见错误

| 错误 | 修复 |
|------|------|
| context 存进 struct | 只作函数第一个参数传递 |
| `WithTimeout` 后不 `cancel()` | 必须 `defer cancel()` 释放资源 |
| 库函数里用 `context.Background()` | 库接收调用方传入的 context |
| 阻塞操作不监听 `ctx.Done()` | channel/HTTP/DB 必须用 context-aware API |
| `context.Value` 放业务配置 | 只放 request-scoped 元数据（trace id 等） |
| 下游随意放大 deadline | 超时预算在入口/边界设置 |

## 深度参考

- [cancellation.md](references/cancellation.md) — 取消传播模式、select + ctx.Done
