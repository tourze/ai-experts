---
name: async-python-patterns
description: 当用户要实现 asyncio、async/await、TaskGroup、timeout、cancellation、并发 I/O 或异步 API 时使用。
---

# Python 异步模式

## 适用场景

- 构建 FastAPI、aiohttp、WebSocket 或其他高并发异步接口。
- 并发执行数据库、HTTP、文件等 I/O 操作。
- 需要为异步代码补齐 timeout、cancellation、backpressure 和并发上限。
- 任务需要持久化、重试和队列治理时，联动 [python-background-jobs](../python-background-jobs/SKILL.md)。
- 需要给异步链路补日志、指标或 tracing 时，联动 [python-observability](../python-observability/SKILL.md)。
- 需要为异步逻辑补 `pytest` 用例时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。

## 核心约束

- 同一条调用链保持“全同步”或“全异步”，不要混入偷偷阻塞的同步 I/O。
- CPU 密集任务不能直接塞进事件循环；要么 `asyncio.to_thread()`，要么进程池。
- 所有外部调用都要定义 timeout、取消策略和并发上限。
- 优先使用结构化并发（`asyncio.TaskGroup`）；只有明确接受脱管任务时才做 fire-and-forget。
- 异步代码里不要出现 `time.sleep()`、同步 ORM 客户端或无界 `asyncio.gather()`。

## 代码模式

```python
import asyncio
from collections.abc import Iterable


async def fetch_one(item: str, semaphore: asyncio.Semaphore) -> str:
    async with semaphore:
        async with asyncio.timeout(2):
            await asyncio.sleep(0.05)
            return item.upper()


async def fetch_all(items: Iterable[str]) -> list[str]:
    semaphore = asyncio.Semaphore(5)
    tasks: list[asyncio.Task[str]] = []

    async with asyncio.TaskGroup() as group:
        for item in items:
            tasks.append(group.create_task(fetch_one(item, semaphore)))

    return [task.result() for task in tasks]


if __name__ == "__main__":
    print(asyncio.run(fetch_all(["a", "b", "c"])))
```

## 检查清单

- 已明确哪些步骤是真异步 I/O，哪些步骤其实是 CPU 或同步阻塞。
- 每个外部依赖都具备 timeout、重试边界和错误传播策略。
- 已限制并发度，而不是对不受控输入直接 `gather(*items)`。
- 任务生命周期可追踪，退出时没有悬空 task。
- 测试覆盖了成功、超时、取消和部分失败场景。

## 反模式

### FAIL: async 函数里调同步阻塞

```python
async def get_data():
    response = requests.get("https://api.example.com")  # 阻塞整个事件循环！
    return response.json()
```

### PASS: 用异步客户端或 to_thread

```python
async def get_data():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com") as resp:
            return await resp.json()
```

### FAIL: 无限并发

```python
await asyncio.gather(*[fetch(url) for url in urls])  # 10000 个 URL = 10000 个并发连接
```

### PASS: 信号量限流

```python
sem = asyncio.Semaphore(10)
async def limited_fetch(url):
    async with sem:
        return await fetch(url)
await asyncio.gather(*[limited_fetch(url) for url in urls])
```

- 用 `create_task()` 启动后台任务，却不保留引用也不收集异常。
- 为了省事吞掉 `CancelledError`。
