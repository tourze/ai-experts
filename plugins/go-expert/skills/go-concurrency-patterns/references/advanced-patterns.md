# Advanced Go Concurrency Patterns

补充 `go-concurrency-patterns` 主文档中省略的两类常见模式：fan-out/fan-in pipeline 与优雅停机。

## 模式 3：fan-out / fan-in pipeline

```go
package concurrency

import "context"

func FanOutFanIn(ctx context.Context, input <-chan int, workerCount int) <-chan int {
	output := make(chan int)

	worker := func() {
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
		go worker()
	}

	return output
}
```

要点：

- 输入 channel 的关闭权仍归生产者。
- 所有 worker 都监听 `ctx.Done()`，避免上游取消后继续阻塞。
- fan-in 结果如果需要 `close(output)`，必须在外层再加 `WaitGroup` 统一收尾。

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
