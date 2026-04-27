# Channel 与 Select 参考手册

## 1. Channel 方向约束

用 `chan<-`（只发）和 `<-chan`（只收）在编译期强制数据流方向，防止误用。

```go
// 生产者只能发送
func producer(out chan<- int) {
    out <- 42
    // <-out // 编译错误：不能从 send-only channel 接收
}

// 消费者只能接收
func consumer(in <-chan int) {
    v := <-in
    // in <- 1 // 编译错误：不能向 receive-only channel 发送
}

func main() {
    ch := make(chan int)
    go producer(ch)
    consumer(ch)
}
```

**规则**：函数签名中，channel 参数始终声明方向，不留双向 `chan T`。

## 2. 无缓冲 vs 有缓冲

| 类型 | 特性 | 适用场景 |
|------|------|----------|
| 无缓冲 | 发送阻塞直到接收方就绪 | 强同步点、信号通知 |
| 有缓冲 | 缓冲区满前发送不阻塞 | 吞吐优先、削峰 |

```go
// 无缓冲：同步语义——确保接收方已处理
done := make(chan struct{})
go func() { work(); close(done) }()
<-done // 阻塞直到 work 完成

// 有缓冲：吞吐语义——生产者不被消费者拖慢
jobs := make(chan Job, runtime.NumCPU()) // 缓冲 = CPU 数，避免 goroutine 爆炸
for _, j := range batch {
    jobs <- j // 缓冲区未满时不阻塞
}
```

**选型依据**：需要"对方一定收到了"用无缓冲；只做流控/削峰用有缓冲。

## 3. Select 必须携带 ctx.Done()

任何长期运行的 `select` 都应包含 `ctx.Done()` 分支，否则无法响应取消。

```go
func process(ctx context.Context, ch <-chan Event) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case e, ok := <-ch:
            if !ok {
                return nil // channel 已关闭
            }
            handle(e)
        }
    }
}
```

**反模式**：省略 `ctx.Done()` 的 select 在上层 cancel 时永久阻塞。

## 4. time.After 在循环中泄漏

`time.After` 每次调用创建新 `Timer`，在循环中使用会堆积未回收的 Timer 直到超时到期。

```go
// 错误：每次循环新建 Timer，旧 Timer 在超时前不会被 GC
for {
    select {
    case <-ctx.Done():
        return
    case <-time.After(5 * time.Second): // 泄漏！
        tick()
    }
}

// 正确：复用单个 Timer
timer := time.NewTimer(5 * time.Second)
defer timer.Stop()
for {
    if !timer.Stop() {
        <-timer.C // 排空过期信号
    }
    timer.Reset(5 * time.Second)

    select {
    case <-ctx.Done():
        return
    case <-timer.C:
        tick()
    }
}
```

## 5. Channel 所有权模式

**规则**：创建 channel 的 goroutine 负责 close；发送方 close；接收方永远不 close。

```go
func fetchData(ctx context.Context) <-chan Result { // 返回只收方向，限制调用方
    ch := make(chan Result, 1)
    go func() {
        defer close(ch) // 所有权：创建者关闭
        select {
        case <-ctx.Done():
            return
        case ch <- query():
        }
    }()
    return ch
}

// 调用方只读，无需关心 close
for r := range fetchData(ctx) {
    process(r)
}
```

双重 close 或向已关闭 channel 发送会 panic；所有权单一化消除此类风险。

## 6. nil Channel 技巧

对 nil channel 的发送/接收永久阻塞，可在 `select` 中动态禁用某个分支。

```go
func merge(a, b <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for a != nil || b != nil {
            select {
            case v, ok := <-a:
                if !ok {
                    a = nil // 禁用 a 分支
                    continue
                }
                out <- v
            case v, ok := <-b:
                if !ok {
                    b = nil // 禁用 b 分支
                    continue
                }
                out <- v
            }
        }
    }()
    return out
}
```

将已关闭的 channel 设为 `nil` 后，该分支永远不会被选中，无需额外布尔标志。
