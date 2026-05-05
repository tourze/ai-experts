# 调试方法论

## 结构化调试流程

1. **感知** — 确认异常现象：日志、指标、用户报告、crash dump。
2. **复现** — 构造最小复现条件；无法稳定复现时先加可观测性。
3. **假设** — 基于证据提出一个可证伪的假设。
4. **验证** — 改一个变量，用测试/profile/日志确认假设成立。
5. **修复** — 改根因代码，补充回归测试。
6. **复盘** — 记录根因、修复方式、为什么之前没防住。

## 假设驱动调试

核心原则：每次只验证一个假设，失败的假设必须记录。

```
现象 → 证据收集 → 假设 A
                      ├─ 验证通过 → 修复根因
                      └─ 验证失败 → 记录失败原因 → 假设 B
                                                  └─ ...
```

失败假设记录格式：

```
假设：goroutine 在 channel 发送侧阻塞
验证：pprof goroutine profile 显示 2000 个 goroutine 卡在 select
结果：否，全部卡在 HTTP response Body 未关闭
教训：先看 profile 再猜
```

## 二分法定位 bug

当问题范围大但能稳定复现时，用二分法缩小范围：

```bash
# git 二分查找引入 bug 的 commit
git bisect start
git bisect bad HEAD
git bisect good v1.2.0
# 每步运行复现测试，标记 good/bad

# 代码二分：注释掉一半逻辑，看问题是否消失
```

## 解读 stack trace

Go crash 时的 stack trace 格式：

```
goroutine 1 [running]:
main.process(0xc0000b2000, 0x5, 0x5)
    /app/main.go:42 +0x39
main.main()
    /app/main.go:18 +0x85
```

关键信息：
- `goroutine N` — 哪个 goroutine crash
- `[running]` / `[chan receive]` / `[semacquire]` — goroutine 状态
- 文件名:行号 — 精确到调用点
- `+0x39` — 函数内偏移，可用 `addr2line` 或 delve 进一步定位

常见状态含义：
- `[running]` — 正在执行（通常是 crash goroutine）
- `[chan receive]` / `[chan send]` — 等待 channel 操作，可能是死锁
- `[semacquire]` — 等待锁，检查是否有锁竞争或死锁
- `[IO wait]` — 等待网络/文件 I/O
- `[select]` — 阻塞在 select 语句

## 生产环境 pprof HTTP 端点

```go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe(":6060", nil))
    }()
    // 业务逻辑...
}
```

注意：
- pprof 端点必须限制访问（防火墙/认证），避免泄露敏感信息。
- 采集 CPU profile 会增加约 5-10% 开销，采集时间建议 30 秒。
- goroutine profile 零开销，可随时采集。

## 常见 Go bug 模式

### 1. nil pointer 解引用

```go
// 原因：函数返回 nil 但调用方未检查
result, err := Query()
if err != nil { ... }
// result 可能为 nil（Query 返回 nil, nil）
fmt.Println(result.Field) // panic
```

### 2. goroutine 泄漏

```go
// 原因：没有退出机制
go func() {
    for {
        ch <- produce() // 永远不会退出，消费端关闭也无人通知
    }
}()

// 修复：接受 context，检查退出信号
go func(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        case ch <- produce():
        }
    }
}(ctx)
```

### 3. channel 死锁

```go
// 原因：无缓冲 channel 只有一个 goroutine
ch := make(chan int)
ch <- 1 // 死锁：没有接收者
```

### 4. data race

```go
// 原因：多个 goroutine 读写同一变量无同步
var counter int
go func() { counter++ }() // 写
fmt.Println(counter)       // 读 — race!

// 修复：用 mutex 或 atomic
var mu sync.Mutex
mu.Lock()
counter++
mu.Unlock()
```
