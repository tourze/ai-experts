---
name: go-testing-patterns
description: 当 Go 代码需要测试设计、table-driven tests、mock、race、fuzz 或 flaky test 排查时使用。
---

# go-testing-patterns

## 适用场景

- 为 Go 函数、HTTP handler、repository、worker、并发代码或 CLI 编写测试。
- 审查测试是否只测实现细节、是否缺错误分支、是否存在顺序依赖或真实时间等待。
- 排查 flaky test、goroutine 泄漏、race detector 失败或集成测试污染。
- 性能测试和 `benchstat` 对比配合 [go-performance-benchmarking](../go-performance-benchmarking/SKILL.md)；并发生命周期配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)。

## 核心约束

- 测试行为合同，不测试内部实现细节；公共 API 优先用外部包名 `package xxx_test`。
- table-driven tests 必须有 `name` 字段并通过 `t.Run(tt.name, ...)` 暴露失败场景。
- 可独立并行的纯函数测试使用 `t.Parallel()`；共享资源、环境变量、全局状态测试不要盲目并行。
- 集成测试用 `//go:build integration` 隔离，普通 `go test ./...` 不应依赖外部服务。
- 时间相关测试优先注入 clock 或使用可控时间，不用 `time.Sleep` 猜测异步完成。
- 并发代码测试要考虑 `go test -race ./...` 和 goroutine leak 检测。

## 代码模式

### 1. table-driven tests

```go
func TestSlugify(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		in   string
		want string
	}{
		{name: "spaces become hyphens", in: "hello world", want: "hello-world"},
		{name: "empty input", in: "", want: ""},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := Slugify(tt.in); got != tt.want {
				t.Fatalf("Slugify(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}
```

### 2. 集成测试使用 build tag

```go
//go:build integration

package userrepo_test

func TestRepositoryIntegration(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/test")
}
```

运行：

```bash
go test -tags=integration ./...
```

### 3. mock consumer-side interface

```go
type emailSender interface {
	Send(ctx context.Context, to string, body string) error
}

type Service struct {
	sender emailSender
}
```

## 检查清单

- 每个测试 case 是否有明确 `name`，失败时能定位场景？
- 是否覆盖成功、错误、边界、空输入和取消路径？
- 测试是否依赖执行顺序、真实时间、真实网络或全局状态？
- 可并行测试是否安全使用 `t.Parallel()`？
- 集成测试是否用 build tag 与单元测试隔离？
- 并发代码是否跑过 `go test -race ./...`，必要时是否有 leak 检测？

## 反模式

### FAIL: 测实现细节

```go
if cache.data["u1"] == nil {
	t.Fatal("missing internal map entry")
}
```

### PASS: 测可观察行为

```go
got, ok := cache.Get("u1")
if !ok || got.ID != "u1" {
	t.Fatal("missing cached user")
}
```

### FAIL: 用 Sleep 等异步完成

```go
go worker.Run()
time.Sleep(100 * time.Millisecond)
```

### PASS: 用同步信号

```go
done := make(chan struct{})
go func() {
	defer close(done)
	worker.Run()
}()
<-done
```
