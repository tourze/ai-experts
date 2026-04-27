# 取消传播与超时预算
## 1. 取消传播机制

调用 `cancel()` 后，`ctx.Done()` 立即关闭，所有从该 context 派生的子 context 都会收到信号。

```go
parentCtx, cancel := context.WithCancel(context.Background())
childCtx, _ := context.WithTimeout(parentCtx, 10*time.Second)

cancel() // parentCtx 和 childCtx 的 Done() 都会关闭

fmt.Println(childCtx.Err()) // context canceled（不是 DeadlineExceeded）
```

规则：父取消，子一定取消；子取消，父不受影响。`context.WithTimeout`、`WithDeadline`、`WithCancel`、`WithValue` 都继承父 context 的取消信号。

## 2. select + ctx.Done() 模式

所有可能阻塞的 channel 操作都应配合 `select` 监听取消信号。

```go
func process(ctx context.Context, jobs <-chan Job, results chan<- Result) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case job, ok := <-jobs:
            if !ok {
                return nil
            }
            results <- doWork(job)
        }
    }
}
```

send 操作同理：`select { case ch <- v: case <-ctx.Done(): return ctx.Err() }`

## 3. HTTP 服务优雅关闭

`http.Server.Shutdown(ctx)` 等待活跃连接完成或 ctx 取消。

```go
srv := &http.Server{Addr: ":8080"}
go srv.ListenAndServe()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
    log.Printf("shutdown: %v", err)
}
```

## 4. 数据库查询取消

使用 `QueryRowContext`、`ExecContext`、`QueryContext` 替代不带 Context 的版本。

```go
func getUser(ctx context.Context, db *sql.DB, id int) (string, error) {
    var name string
    err := db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = ?", id).Scan(&name)
    if err != nil {
        return "", fmt.Errorf("getUser: %w", err)
    }
    return name, nil
}
```

当 ctx 取消时，驱动会向数据库发送取消指令，释放连接回连接池。

## 5. 超时预算：在边界设置，不要下游覆盖

```go
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
    defer cancel()
    result, err := h.svc.DoWork(ctx) // 下游共享同一超时预算
}
```

反模式：中间层用 `context.Background()` 或更长的超时重建 context，上游取消信号丢失。

```go
func (s *Service) DoWork(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // 上游 ctx 被丢弃
    defer cancel()
}
```

## 6. WithTimeout vs WithDeadline

- `WithTimeout(ctx, d)` 等价于 `WithDeadline(ctx, time.Now().Add(d))`，设定相对时长。
- `WithDeadline(ctx, t)` 设定绝对时间点，适合多个操作共享同一截止时刻。

```go
// 相对超时：这次请求最多 2 秒
ctx, cancel := context.WithTimeout(parentCtx, 2*time.Second)

// 绝对 deadline：所有操作必须在下午 5 点前完成
deadline := time.Date(2025, 1, 1, 17, 0, 0, 0, time.Local)
ctx, cancel := context.WithDeadline(parentCtx, deadline)
```

两者都返回 cancel 函数，调用后立即取消。

## 7. 不要把 context 存进 struct

```go
// 反模式
type Worker struct {
    ctx context.Context // 生命周期与 struct 绑定，测试无法注入
}

// 正确：每次调用显式传入
type Worker struct{}

func (w *Worker) Run(ctx context.Context) error { return nil }
```

## 8. 常见陷阱：创建了 context 但忘记传递

```go
func (s *Service) Fetch(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    // 反模式：没传 ctx，超时无效
    req, _ := http.NewRequest(http.MethodGet, s.url, nil)

    // 正确
    req, _ = http.NewRequestWithContext(ctx, http.MethodGet, s.url, nil)
    resp, err := http.DefaultClient.Do(req)
    _ = resp
    return err
}
```

## 检查要点

| 要点 | 检查方式 |
|------|----------|
| cancel 是否被调用 | `defer cancel()` 紧跟 `With*` |
| ctx 是否传给下游 | grep 所有外部调用是否接收 ctx |
| 超时是否在边界设置 | HTTP handler / gRPC 入口 / CLI main |
| select 覆盖 ctx.Done | 检查所有 channel / send 操作 |
| struct 持有 context | grep struct 定义中的 `ctx context.Context` |
