# Advanced Go Concurrency Patterns

补充 `go-concurrency-patterns` 主文档中省略的完整 worker pool、fan-out/fan-in pipeline 与优雅停机。

## 模式 1：完整 worker pool

```go
package concurrency

import (
	"context"
	"sync"
)

type Job struct{ ID int }
type Result struct {
	ID  int
	Err error
}

func RunWorkerPool(ctx context.Context, workerCount int, jobs []Job, fn func(context.Context, Job) error) []Result {
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

## 模式 3：fan-out / fan-in pipeline

```go
package concurrency

import (
	"context"
	"sync"
)

func FanOutFanIn(ctx context.Context, input <-chan int, workerCount int) <-chan int {
	output := make(chan int)
	var wg sync.WaitGroup

	worker := func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			case item, ok := <-input:
				if !ok {
					return
				}
				select {
				case <-ctx.Done():
					return
				case output <- item * 2:
				}
			}
		}
	}

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go worker()
	}

	go func() {
		wg.Wait()
		close(output)
	}()

	return output
}
```

要点：

- 输入 channel 的关闭权仍归生产者。
- 所有 worker 都监听 `ctx.Done()`，避免上游取消后继续阻塞。
- fan-in 结果由 `WaitGroup` 统一收尾后关闭，调用方可以 `range output` 确定性等待。
- 如果 worker 需要返回错误，优先改为 `errgroup.WithContext`，不要通过日志吞掉。

## 模式 4：优雅停机

```go
package concurrency

import (
	"context"
	"net/http"
	"time"
)

func ShutdownServer(server *http.Server) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return server.Shutdown(ctx)
}
```

要点：

- 统一从根 `context` 往下传播取消信号。
- 优先用 `Server.Shutdown` / `errgroup.WithContext` / channel 关闭收尾，不用 `time.Sleep` 猜任务是否完成。
- 停机阶段若仍有 goroutine 需要刷盘或落指标，给明确超时预算。
