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
```

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
await asyncio.gather(*[fetch(url) for url in urls])  # 10000 并发
```

### PASS: 信号量限流

```python
sem = asyncio.Semaphore(10)
async def limited_fetch(url):
    async with sem:
        return await fetch(url)
```
