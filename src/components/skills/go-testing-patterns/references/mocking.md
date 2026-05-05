# Mock 与隔离模式

## 接口定义在消费方

在需要依赖的包里定义最小接口，不要依赖提供方的完整接口。

```go
// 正确：消费方定义所需最小接口 (pkg/order/service.go)
type UserLookup interface {
    Name(ctx context.Context, id int64) (string, error)
}
type Service struct { users UserLookup }

// 错误：import "pkg/user" → 依赖过重，mock 需实现全部方法
```

## 手写 mock vs 生成 mock

| 维度 | 手写 mock | 生成 mock（mockgen） |
|---|---|---|
| 接口变动 | 手动更新 | 自动重新生成 |
| 适用 | 方法少（1-3 个） | 方法多、频繁变动 |

```go
// 手写 mock
type mockNotifier struct { sent []string; err error }
func (m *mockNotifier) Send(to, msg string) error {
    m.sent = append(m.sent, to); return m.err
}

// mockgen 生成
//go:generate mockgen -source=user.go -destination=mock/user.go -package=mock
```

## 可注入的时钟接口

```go
type Clock interface { Now() time.Time }
type realClock struct{}
func (realClock) Now() time.Time { return time.Now() }
type fakeClock struct{ fixed time.Time }
func (c fakeClock) Now() time.Time { return c.fixed }

func TestExpire(t *testing.T) {
    past := fakeClock{fixed: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)}
    item := Item{ExpiresAt: past.Now().Add(-time.Hour)}
    assert.True(t, item.IsExpired(past))
}
```

## 环境变量隔离

`t.Setenv` 测试结束后自动恢复原始值。

```go
func TestConfig(t *testing.T) {
    t.Setenv("APP_ENV", "test")
    t.Setenv("DB_URL", "postgres://localhost/test")
    cfg := LoadConfig()
    assert.Equal(t, "test", cfg.Env)
}
```

注意：`t.Setenv` 与 `t.Parallel()` 存在冲突，不要在并行测试中混用。

## 临时文件和目录

`t.TempDir()` 测试结束自动清理。

```go
func TestFileStore(t *testing.T) {
    dir := t.TempDir()
    store := NewFileStore(dir)
    require.NoError(t, store.Save("data.txt", []byte("hello")))
    got, err := store.Load("data.txt")
    assert.NoError(t, err)
    assert.Equal(t, "hello", string(got))
}
```

## goroutine 泄漏检测

使用 `go.uber.org/goleak` 在测试结束后检测泄漏的 goroutine。

```go
func TestMain(m *testing.M) { goleak.VerifyTestMain(m) }

// 或单个测试
func TestServerShutdown(t *testing.T) {
    defer goleak.VerifyNone(t)
    srv := NewServer()
    srv.Start()
    srv.Shutdown(context.Background())
}
```

常见泄漏原因：`go` 协程无退出条件、HTTP 连接未关闭、channel 未关闭导致阻塞。
