---
name: go-concurrency-patterns
description: 当 Go 代码涉及并发、goroutine 生命周期控制或竞态排查时使用。
---

# go-concurrency-patterns

## 适用场景

- 构建有上限的 worker pool、fan-out / fan-in pipeline、批量请求并发执行。
- 需要把取消信号、超时和错误传播到整条 goroutine 链路。
- 需要实现服务优雅停机，避免 goroutine 泄漏、悬挂 channel、僵尸任务。
- 需要排查“偶发超时”“结果收不齐”“进程退出卡住”“竞态条件”这类并发缺陷。
- 相关 skill：
  需要取消链路时配合 [go-context-lifecycle](../go-context-lifecycle/SKILL.md)；
  需要并发测试与 race 验证时配合 [go-testing-patterns](../go-testing-patterns/SKILL.md)；
  需要 map/slice 共享状态或资源释放审查时配合 [go-safety](../go-safety/SKILL.md)；
  需要确认锁竞争、goroutine 堆积或吞吐瓶颈时配合 [go-performance-benchmarking](../go-performance-benchmarking/SKILL.md)。

## 核心约束

- 每个 goroutine 都必须有明确退出路径：`ctx.Done()`、输入 channel 关闭、或父协程回收。
- channel 的关闭权属于发送方；接收方只能消费，不能“代替上游收尾”。
- 并发数必须可控：默认使用 `errgroup.SetLimit` 或信号量，不要无限制 `go func()`。
- 错误传播必须和取消联动：某个子任务失败后，其他子任务应尽快退出，而不是继续写共享状态。
- 避免把 `sync.Map` 当作默认容器。它只适合“高读低写、键空间稳定”的热点缓存；写多读少时优先分片 map + `RWMutex`。
- 不要用 `time.Sleep` 做同步。等待完成请用 `WaitGroup`、channel、`errgroup` 或明确条件变量。
- 不要让并发代码吞掉错误。子任务失败后，要么进入结果集合，要么通过 `errgroup` 触发取消。

## 代码模式

### 模式 1：有界 worker pool

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

适用条件：
任务数已知、单个任务可以独立执行、失败不一定要立即取消全批任务。生产者关闭 `jobCh`，外层 `WaitGroup` 关闭结果 channel。

### 模式 2：`errgroup` + 限流，先失败先取消

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

适用条件：
任一子任务失败都应该终止整批流程，例如批量远程调用、聚合查询、预热任务。

fan-out/fan-in pipeline、优雅停机和完整 worker pool 代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 每条 goroutine 链路是否有明确退出条件（`ctx.Done()`、channel 关闭）？
- channel 是否由发送方关闭，且只关闭一次？
- 并发上限是否显式编码（`errgroup.SetLimit` / semaphore）？
- 共享状态是否声明了所有权：谁写、谁读、何时清理？
- 错误是否会传播到调用方，还是被 goroutine 静默吞掉？
- 是否跑了 `go test -race ./...`？

## 反模式

### FAIL: 无限制 goroutine + Sleep 同步

```go
for _, item := range items {
    go func(it Item) {
        process(it) // 无并发上限
    }(item)
}
time.Sleep(5 * time.Second) // “应该差不多完成了”
```

→ 1 万个 item = 1 万个 goroutine，且 Sleep 不保证全部完成。

### PASS: 有界 worker + WaitGroup

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10) // 最多 10 个并发
for _, item := range items {
    item := item
    g.Go(func() error {
        return process(ctx, item)
    })
}
if err := g.Wait(); err != nil { // 确定性等待
    return err
}
```

### FAIL: 接收方关闭上游 channel

```go
func consumer(ch chan int) {
    for v := range ch {
        fmt.Println(v)
    }
    close(ch) // panic: 发送方还在写！
}
```

### PASS: 发送方负责关闭

```go
func producer(ch chan int, items []int) {
    defer close(ch) // 发送方关闭
    for _, v := range items {
        ch <- v
    }
}
```

- 在多个 goroutine 里偷偷写共享 map / slice，却没有锁或消息传递边界。
- 收到 `ctx.Done()` 后继续向结果 channel 写数据，导致停机阶段阻塞或泄漏。
