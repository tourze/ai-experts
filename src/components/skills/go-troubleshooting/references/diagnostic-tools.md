# 诊断工具速查

## pprof 命令

```bash
# CPU profile（本地 benchmark）
go test -run='^$' -bench=. -cpuprofile=/tmp/cpu.out ./...

# CPU profile（运行中服务，30 秒）
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine profile
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Execution trace
go test -trace=/tmp/trace.out ./... && go tool trace /tmp/trace.out
```

### pprof 交互命令

| 命令 | 用途 |
|------|------|
| `top20` | 最耗资源的 20 个函数 |
| `list funcName` | 函数内逐行耗时/分配 |
| `web` | 生成调用图（需 graphviz） |
| `peek funcName` | 查看调用者/被调用者 |
| `traces` | 显示完整调用栈 |

### heap 排序维度

```bash
go tool pprof -alloc_objects mem.out   # 按分配对象数
go tool pprof -inuse_space mem.out     # 按占用内存
go tool pprof -alloc_space mem.out     # 按分配总量（含已释放）
```

## delve 调试器

```bash
dlv debug ./cmd/server -- --config=dev.yaml   # 启动调试
dlv attach <pid>                               # 附加到运行中进程
```

### 常用命令

| 命令 | 缩写 | 用途 |
|------|------|------|
| `break main.process` | `b` | 函数入口设断点 |
| `break main.go:42` | `b` | 指定行设断点 |
| `continue` | `c` | 继续到下一个断点 |
| `step` | `s` | 单步进入函数 |
| `next` | `n` | 单步跳过调用 |
| `print varName` | `p` | 打印变量值 |
| `goroutines` | | 列出所有 goroutine |
| `goroutine 5 bt` | | 查看 goroutine 5 调用栈 |
| `stack` | `bt` | 当前调用栈 |

### 条件断点

```
(dlv) break main.go:42
(dlv) condition 1 err != nil
```

## GODEBUG 环境变量

```bash
GODEBUG=gctrace=1 go run main.go            # GC 日志（每次 GC 一行摘要）
GODEBUG=schedtrace=1000 go run main.go      # 调度器追踪（每秒输出）
GODEBUG=asyncpreemptoff=1 go run main.go    # 禁用异步抢占（调试调度问题）
GODEBUG=gctrace=1,schedtrace=1000 go run main.go  # 组合使用
```

### gctrace 输出解读

```
gc 5 @0.150s 3%: 0.020+1.2+0.005 ms clock, 8->8->1 MB, 9 MB goal, 8 P
```

| 字段 | 含义 |
|------|------|
| `gc 5` | 第 5 次 GC |
| `3%` | GC 占总 CPU 百分比 |
| `0.020+1.2+0.005 ms` | STW 清扫 + 并发标记 + STW 收尾 |
| `8->8->1 MB` | GC 前/后/存活堆大小 |
| `9 MB goal` | 下次 GC 触发阈值 |

## go test -race

```bash
go test -race ./...                  # 全项目竞态检测
go test -race ./pkg/concurrent/      # 特定包
go test -race -bench=. ./...         # 结合 benchmark
```

race 输出解读：关注 `Write at` 和 `Previous read` 分别在哪个 goroutine、哪个文件哪一行。

## strace / dtrace

```bash
strace -c -p <pid>                   # Linux：统计系统调用
strace -e trace=network -p <pid>     # 只追踪网络调用
sudo dtruss -c -p <pid>              # macOS（需 sudo）
```

适用场景：I/O 瓶颈、文件描述符泄漏、网络连接异常。

## 快速参考

| 场景 | 工具 | 命令 |
|------|------|------|
| CPU 热点 | pprof | `go tool pprof cpu.out` |
| 内存增长 | pprof heap | `go tool pprof -alloc_objects mem.out` |
| goroutine 泄漏 | pprof goroutine | `go tool pprof http://host:6060/debug/pprof/goroutine` |
| 死锁分析 | pprof goroutine | 查看 `[chan receive]`/`[semacquire]` 状态 |
| 数据竞争 | race detector | `go test -race ./...` |
| 调度延迟 | trace | `go tool trace trace.out` |
| 交互调试 | delve | `dlv debug ./cmd/app` |
| GC 压力 | GODEBUG | `GODEBUG=gctrace=1 go run main.go` |
| I/O 瓶颈 | strace | `strace -c -p <pid>` |
