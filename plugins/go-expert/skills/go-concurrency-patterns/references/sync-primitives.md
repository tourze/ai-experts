# sync 原语参考手册

## 1. sync.Mutex

临界区尽量短，绝不在持有锁时做 I/O。

```go
type Cache struct {
    mu   sync.Mutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.Lock()
    v, ok := c.data[key]
    c.mu.Unlock() // 尽快释放，不要 defer 到函数末尾做 I/O
    return v, ok
}
```

**规则**：`Lock()` 后紧跟业务逻辑，处理完立即 `Unlock()`；`defer` 仅用于短函数。

## 2. sync.RWMutex

读多写少场景。禁止在持有 `RLock` 时尝试升级为 `Lock`（死锁）。

```go
type Registry struct {
    mu   sync.RWMutex
    vals map[string]int
}

func (r *Registry) Read(key string) int {
    r.mu.RLock()
    defer r.mu.RUnlock()
    return r.vals[key]
}

func (r *Registry) Write(key string, val int) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.vals[key] = val
}
```

**死锁陷阱**：`RLock` -> `Lock` 会自阻塞（写锁等待所有读锁释放，而自己正持有读锁）。

## 3. sync/atomic — 类型化原子操作（Go 1.19+）

优先使用 `atomic.Int64`、`atomic.Bool` 等类型化封装，避免裸 `atomic.AddInt64(&x, 1)`。

```go
var counter atomic.Int64
var ready atomic.Bool

counter.Add(1)
n := counter.Load()

ready.Store(true)
if ready.Load() {
    start()
}
```

**优势**：编译期类型安全，不用传指针，减少误用。

## 4. sync.Map

仅适用于读远多于写、且 key 集合相对稳定的场景。写密集场景用 `sync.RWMutex` + 普通 `map`。

```go
var cache sync.Map

// 写
cache.Store("key", value)

// 读
v, ok := cache.Load("key")

// 遍历
cache.Range(func(k, v any) bool {
    process(k, v)
    return true
})
```

**选型**：写占比 > 10% 或 key 频繁增删 → 用 `RWMutex + map`。

## 5. sync.Pool

复用临时对象减少 GC 压力。`Put` 前必须 `Reset()` 清理状态。

```go
var bufPool = sync.Pool{
    New: func() any { return &bytes.Buffer{} },
}

func process() {
    b := bufPool.Get().(*bytes.Buffer)
    b.Reset() // 安全起见先清空
    defer func() {
        b.Reset()       // Put 前必须清理
        bufPool.Put(b)
    }()
    // 使用 b ...
}
```

**注意**：Pool 内容可能在任意时刻被 GC 回收，不保证持久化。

## 6. sync.Once（Go 1.21+ 增强）

Go 1.21 新增 `OnceFunc`、`OnceValue`、`OnceValues`，避免手写闭包。

```go
// Go 1.21+：返回单个值
var getClient = sync.OnceValue(func() *Client { return NewClient() })

// Go 1.21+：返回值+错误
var getConn = sync.OnceValues(func() (*Conn, error) { return Dial(addr) })
```

## 7. sync.WaitGroup

`Add` 必须在 `go` 之前调用。Go 1.24+ 可用 `wg.Go()` 合并三步。

```go
// Go 1.24+: wg.Go 自动 Add/Done
var wg sync.WaitGroup
for _, task := range tasks {
    wg.Go(func() { process(task) })
}
wg.Wait()

// 旧版: Add 必须在 go 之前
// wg.Add(1); go func(){ defer wg.Done(); ... }()
```

## 8. singleflight — 去重并发调用

防止缓存击穿（cache stampede）：多个 goroutine 同时请求同一 key，只执行一次。

```go
import "golang.org/x/sync/singleflight"

var sf singleflight.Group

func getUser(id string) (*User, error) {
    v, err, _ := sf.Do(id, func() (any, error) {
        return db.QueryUser(id) // 并发请求只执行一次
    })
    if err != nil {
        return nil, err
    }
    return v.(*User), nil
}
```

## 9. errgroup — 错误传播与并发控制

`WithContext` 在任一 goroutine 出错时 cancel context；`SetLimit` 控制并发数。

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) error {
    g, ctx := errgroup.WithContext(ctx)
    g.SetLimit(10) // 最多 10 并发

    for _, url := range urls {
        url := url
        g.Go(func() error {
            req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
            resp, err := http.DefaultClient.Do(req)
            if err != nil { return err }
            defer resp.Body.Close()
            return process(resp.Body)
        })
    }
    return g.Wait() // 任一出错即返回错误
}
```

## 10. 快速参考表

| 原语 | 用途 | 关键约束 |
|------|------|----------|
| `sync.Mutex` | 互斥访问 | 临界区短，不跨 I/O |
| `sync.RWMutex` | 读多写少 | 禁止 RLock -> Lock 升级 |
| `atomic.Int64/Bool` | 无锁计数/标志 | Go 1.19+ 类型化优先 |
| `sync.Map` | 并发只读/极少写 map | 写密集改用 RWMutex+map |
| `sync.Pool` | 临时对象复用 | Put 前必须 Reset |
| `sync.OnceFunc` | 单次初始化 | Go 1.21+ 优先 |
| `sync.WaitGroup` | 等待一组 goroutine | Add 在 go 之前 |
| `singleflight` | 去重并发调用 | 防 cache stampede |
| `errgroup` | 错误传播+并发限制 | WithContext 联动 cancel |
