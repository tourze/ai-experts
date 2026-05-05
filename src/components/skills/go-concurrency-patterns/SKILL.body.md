通用并发原则（不阻塞异步上下文、限制并发、传播取消、不共享可变状态、超时所有外部调用、优雅停机）见 architecture-expert 的 concurrency-patterns skill。

## Go 特有约束

- 每个 goroutine 都必须有明确退出路径：`ctx.Done()`、输入 channel 关闭、或父协程回收。
- channel 的关闭权属于发送方；接收方只能消费，不能代替上游收尾。
- 并发数必须可控：默认使用 `errgroup.SetLimit` 或信号量。
- 错误传播必须和取消联动：某个子任务失败后，其他子任务尽快退出。
- 避免把 `sync.Map` 当作默认容器。写多读少时优先分片 map + `RWMutex`。
- 不要用 `time.Sleep` 做同步。等待完成用 `WaitGroup`、channel、`errgroup`。

## Go 代码模式

### errgroup + 限流，先失败先取消

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(limit)
for _, item := range items {
    item := item
    g.Go(func() error {
        return process(ctx, item)
    })
}
return g.Wait()
```

### 有界 worker pool

```go
for i := 0; i < workerCount; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for job := range jobCh {
            resultCh <- run(ctx, job)
        }
    }()
}
```

fan-out/fan-in pipeline、优雅停机完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## Go 常见错误

| 错误 | 修复 |
|------|------|
| 无限制 `go func()` | `errgroup.SetLimit(n)` 或信号量 |
| 接收方关闭 channel | 关闭权属于发送方 |
| `time.After` 在循环中 | `time.NewTimer` + `Reset` |
| `select` 缺少 `ctx.Done()` | goroutine 泄漏 |
| `wg.Add` 放在 goroutine 内 | `Add` 必须在 `go` 之前 |
| mutex 持有跨越 I/O | 临界区保持最短 |
| 未跑 race 检测 | `go test -race ./...` |

## 深度参考

- [advanced-patterns.md](references/advanced-patterns.md) — worker pool、fan-out/fan-in、优雅停机
- [channels-and-select.md](references/channels-and-select.md) — channel 方向、缓冲、select 模式
- [sync-primitives.md](references/sync-primitives.md) — Mutex/RWMutex/atomic/Once/Pool/singleflight
