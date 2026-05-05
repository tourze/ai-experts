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
