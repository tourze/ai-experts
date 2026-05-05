# 并发模式

## 适用场景

- 需要设计异步任务、并发请求、事件循环或后台 worker。
- 需要排查竞态条件、死锁、goroutine/task 泄漏或内存可见性问题。
- 需要在各语言落地时加载对应语言 skill：各语言版提供具体语法和惯用写法。

## 核心约束

- **不阻塞异步上下文**：异步代码路径中禁止同步 I/O 或长时间计算；大计算用专用线程池/worker 隔离。
- **限制并发**：用信号量/errgroup/JoinSet 绑上限，避免无界并发打垮下游。
- **传播取消**：取消信号必须从入口传到所有子任务；子任务收到取消后尽快退出，不启动新工作。
- **不共享可变状态**：跨并发上下文用消息传递/channel；必须共享时用锁保护，但优先消息传递。
- **超时所有外部调用**：HTTP/RPC/DB/消息队列都设超时，不设默认无限等待。
- **生命周期管理**：每个并发任务有明确 owner 和退出路径；不泄漏 goroutine/coroutine/task。
- **优雅停机**：监听信号 → 停止接受新工作 → 在超时内排空进行中任务。

## 通用模式

### 并发限流

```
任务队列 → 信号量/令牌桶（N 并发）→ Worker 池
超过并发上限的任务排队或快速失败（取决于场景）
```

### 取消传播

```
入口 ctx/timeout
  ├─ 子任务 A：select { case <-ctx.Done(): return }
  ├─ 子任务 B：select { case <-ctx.Done(): return }
  └─ 子任务 C：select { case <-ctx.Done(): return }
任一 ctx 取消，所有子任务在 next await/yield/select 点退出
```

### 优雅停机

```
1. 收到 SIGTERM/SIGINT
2. 停止接受新请求/新消息
3. 排空进行中请求（有超时上限）
4. 关闭连接池、刷新缓冲
5. 退出
```

## 检查清单

- 所有外部调用是否都有超时。
- 并发数是否有上限，不会无界增长。
- 取消信号是否从入口传播到所有子任务。
- 跨并发边界是否避免了共享可变状态。
- 每个并发任务是否有明确的退出路径。
- 优雅停机是否覆盖了所有长生命周期任务。

## 反模式

### FAIL: 异步上下文里做同步阻塞

```python
async def handle(request):
    data = open("large.csv").read()  # 同步 I/O，阻塞整个 event loop
    return process(data)
```

### PASS: 异步 I/O + 大计算隔离

```python
async def handle(request):
    data = await aiofiles.open("large.csv").read()  # 异步 I/O
    return await asyncio.to_thread(process, data)    # CPU 密集在线程池跑
```

### FAIL: 无界并发

```python
tasks = [asyncio.create_task(fetch(url)) for url in urls]  # 10000 个 URL → 10000 并发
```

### PASS: 信号量限流

```python
sem = asyncio.Semaphore(50)
async def bounded_fetch(url):
    async with sem:
        return await fetch(url)
```

### FAIL: 不设超时

```go
resp, err := http.Get(url)  // 可能永远卡住
```

### PASS: 带超时

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
req := req.WithContext(ctx)
resp, err := client.Do(req)
```
