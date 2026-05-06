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
