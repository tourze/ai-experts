# Go Context 生命周期

与 `go-concurrency-patterns` 联动的 context 取消链路模式。

## 核心原则

- 每个 goroutine 的 lifecycle 都应由 context 控制。
- 父 context 取消时，子 goroutine 必须感知并退出。

## 模式

```go
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        case task := <-tasks:
            process(task)
        }
    }
}
```

## 约束

- 不把 context 存到 struct 里（作为字段），应通过参数传递。
- `context.Background()` 仅用于 main / init / test 入口。
- 超时控制使用 `context.WithTimeout` 或 `context.WithDeadline`。
- 取消后需要清理资源（关闭连接、释放锁）。
