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
  需要覆盖面设计时配合 `testing-strategy` 与 `test-brainstorm`；
  需要阻塞/死锁根因排查时配合 `debug-lldb`；
  需要从日志时序反推问题时配合 `log-analyzer`。

## 核心约束

- 每个 goroutine 都必须有明确退出路径：`ctx.Done()`、输入 channel 关闭、或父协程回收。
- channel 的关闭权属于发送方；接收方只能消费，不能“代替上游收尾”。
- 并发数必须可控：默认使用 `errgroup.SetLimit` 或信号量，不要无限制 `go func()`。
- 错误传播必须和取消联动：某个子任务失败后，其他子任务应尽快退出，而不是继续写共享状态。
- 避免把 `sync.Map` 当作默认容器。它只适合“高读低写、键空间稳定”的热点缓存；写多读少时优先分片 map + `RWMutex`。
- 不要用 `time.Sleep` 做同步。等待完成请用 `WaitGroup`、channel、`errgroup` 或明确条件变量。

## 代码模式

### 模式 1：有界 worker pool，结果收集与取消联动

```go
package concurrency

import (
	"context"
	"sync"
)

type Job struct {
	ID int
}

type Result struct {
	ID  int
	Err error
}

func RunWorkerPool(
	ctx context.Context,
	workerCount int,
	jobs []Job,
	fn func(context.Context, Job) error,
) []Result {
	if workerCount <= 0 {
		workerCount = 1
	}

	jobCh := make(chan Job)
	resultCh := make(chan Result, len(jobs))

	var wg sync.WaitGroup
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case job, ok := <-jobCh:
					if !ok {
						return
					}
					resultCh <- Result{ID: job.ID, Err: fn(ctx, job)}
				}
			}
		}()
	}

	go func() {
		defer close(jobCh)
		for _, job := range jobs {
			select {
			case <-ctx.Done():
				return
			case jobCh <- job:
			}
		}
	}()

	go func() {
		wg.Wait()
		close(resultCh)
	}()

	results := make([]Result, 0, len(jobs))
	for result := range resultCh {
		results = append(results, result)
	}
	return results
}
```

适用条件：
任务数已知、单个任务可以独立执行、失败不一定要立即取消全批任务。

### 模式 2：`errgroup` + 限流，先失败先取消

```go
package concurrency

import (
	"context"
	"fmt"
	"net/http"

	"golang.org/x/sync/errgroup"
)

func FetchStatusCodes(
	ctx context.Context,
	client *http.Client,
	urls []string,
	limit int,
) ([]int, error) {
	if client == nil {
		client = http.DefaultClient
	}
	if limit <= 0 {
		limit = 1
	}

	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(limit)

	statuses := make([]int, len(urls))
	for i, url := range urls {
		i, url := i, url
		g.Go(func() error {
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
			if err != nil {
				return fmt.Errorf("build request %s: %w", url, err)
			}

			resp, err := client.Do(req)
			if err != nil {
				return fmt.Errorf("request %s: %w", url, err)
			}
			defer resp.Body.Close()

			statuses[i] = resp.StatusCode
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return statuses, nil
}
```

适用条件：
任一子任务失败都应该终止整批流程，例如批量远程调用、聚合查询、预热任务。

### 模式 3：fan-out / fan-in pipeline，明确谁负责关闭输出

```go
package concurrency

import (
	"context"
	"sync"
)

func Generate(ctx context.Context, nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			select {
			case <-ctx.Done():
				return
			case out <- n:
			}
		}
	}()
	return out
}

func Square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			select {
			case <-ctx.Done():
				return
			case out <- n * n:
			}
		}
	}()
	return out
}

func Merge(ctx context.Context, inputs ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup

	for _, input := range inputs {
		input := input
		wg.Add(1)
		go func() {
			defer wg.Done()
			for n := range input {
				select {
				case <-ctx.Done():
					return
				case out <- n:
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}
```

适用条件：
多个阶段串联、每个阶段都可能扩缩容，且需要统一汇总结果。

### 模式 4：优雅停机，先停入口再等存量 goroutine 退出

```go
package concurrency

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
)

type Server struct {
	wg sync.WaitGroup
}

func (s *Server) Start(ctx context.Context, workerCount int) {
	for i := 0; i < workerCount; i++ {
		s.wg.Add(1)
		go func() {
			defer s.wg.Done()
			<-ctx.Done()
		}()
	}
}

func (s *Server) Wait() {
	s.wg.Wait()
}

func WaitForShutdown(parent context.Context, workerCount int) {
	ctx, cancel := context.WithCancel(parent)
	defer cancel()

	server := &Server{}
	server.Start(ctx, workerCount)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	<-sigCh
	cancel()
	server.Wait()
}
```

适用条件：
长生命周期服务、消费任务的后台进程、需要在退出前释放连接或刷盘的程序。

## 检查清单

- 是否给每条 goroutine 链路提供了退出条件，而不是默认“跑到进程结束”？
- 是否由发送方关闭 channel，且只关闭一次？
- 是否把并发上限显式编码进实现，而不是依赖部署层面“机器够大”？
- 是否在共享状态上声明了所有权：谁写、谁读、何时清理？
- 是否对失败路径做了取消传播，而不是只处理 happy path？
- 是否为关键并发路径准备了 `go test -race ./...`、超时测试、取消测试和慢消费者测试？
- 是否在日志中记录了任务 ID、goroutine 入口/出口、取消原因和超时边界？

## 反模式

- 为每个输入直接 `go func()`，没有限流、没有回收、没有背压。
- 接收方关闭上游 channel，导致 panic 或双重关闭。
- 用 `time.Sleep` 等待“应该差不多完成了”，而不是用确定性的同步原语。
- 在多个 goroutine 里偷偷写共享 map / slice / error 变量，却没有锁或消息传递边界。
- 默认使用 `sync.Map`，却没有证明读多写少；最终得到更难调试的热点锁争用。
- 收到 `ctx.Done()` 后继续向结果 channel 写数据，导致停机阶段阻塞或泄漏。
