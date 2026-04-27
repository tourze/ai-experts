# pprof 深度参考

## 采集 profile

### 从 benchmark 采集

```bash
# CPU profile
go test -run='^$' -bench=BenchmarkEncode -cpuprofile=/tmp/cpu.out ./pkg/codec

# Heap profile（分配对象数）
go test -run='^$' -bench=BenchmarkEncode -memprofile=/tmp/mem.out ./pkg/codec

# Mutex profile
go test -run='^$' -bench=BenchmarkEncode -mutexprofile=/tmp/mutex.out ./pkg/codec

# Block profile（阻塞时间）
go test -run='^$' -bench=BenchmarkEncode -blockprofile=/tmp/block.out ./pkg/codec

# Execution trace
go test -run='^$' -bench=BenchmarkEncode -trace=/tmp/trace.out ./pkg/codec
```

### 从运行中服务采集

```go
import _ "net/http/pprof"

// 在 main 中启动 pprof HTTP server
go func() {
    http.ListenAndServe(":6060", nil)
}()
```

```bash
# 采集 30 秒 CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 采集 heap profile
go tool pprof http://localhost:6060/debug/pprof/heap

# 采集 goroutine
go tool pprof http://localhost:6060/debug/pprof/goroutine
```

## 分析 profile

### CPU profile 命令

```bash
go tool pprof /tmp/cpu.out
```

交互命令：
- `top20` — 查看最耗 CPU 的 20 个函数
- `list funcName` — 查看函数内每行的耗时
- `web` — 生成调用图（需要 graphviz）
- `svg` — 输出 SVG 调用图
- `peek funcName` — 查看调用者/被调用者

### Heap profile 命令

```bash
# 按分配对象数排序
go tool pprof -alloc_objects /tmp/mem.out

# 按占用内存排序
go tool pprof -inuse_space /tmp/mem.out

# 按占用对象数排序
go tool pprof -inuse_objects /tmp/mem.out
```

### Trace 分析

```bash
go tool trace /tmp/trace.out
```

浏览器打开后可查看：
- Goroutine 调度时间线
- GC 暂停时刻和持续时间
- 网络阻塞 / 系统调用阻塞
- Goroutine 创建和销毁

## 常见 pprof 工作流

### 1. 定位 CPU 热点

```bash
go tool pprof -top /tmp/cpu.out
# 关注 flat% 高的函数
# 然后 list <func> 看具体行
```

### 2. 定位内存分配热点

```bash
go tool pprof -alloc_objects -top /tmp/mem.out
# 找到分配最多的函数
# 用 list <func> 确认哪行分配
```

### 3. 逃逸分析

```bash
go build -gcflags="-m" ./pkg/...
# 找 "moved to heap" — 不必要的堆分配
# 找 "does not escape" — 编译器优化的栈分配
```

### 4. 结构体对齐

```bash
go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
fieldalignment ./pkg/model/
# 自动修复字段顺序，减少 padding
```

## GODEBUG 调优

```bash
# 查看 GC 决策日志
GODEBUG=gctrace=1 go run main.go

# 输出示例：
# gc 1 @0.003s 2%: 0.018+0.52+0.003 ms clock, 0.14+0.21/1.0/0.37+0.024 ms cpu, 4->4->0 MB, 5 MB goal, 8 P
```

字段含义：
- `2%` — GC 占用的 CPU 时间
- `4->4->0 MB` — GC 前/后/存活堆大小
- `5 MB goal` — 下次 GC 触发阈值

## 快速参考

```bash
# 本地
go tool pprof cpu.out              # CPU 分析
go tool pprof -alloc_objects mem.out # 内存分析
go tool pprof -http=:8080 cpu.out  # Web UI
go tool trace trace.out            # 执行 trace

# 服务
go tool pprof http://host:6060/debug/pprof/profile?seconds=30
go tool pprof http://host:6060/debug/pprof/heap

# 逃逸
go build -gcflags="-m" ./...
fieldalignment ./...
```
