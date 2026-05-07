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
