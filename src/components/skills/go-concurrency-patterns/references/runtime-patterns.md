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

fan-out/fan-in pipeline、优雅停机完整代码见 [references/advanced-patterns.md](./advanced-patterns.md)。
