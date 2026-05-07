## 代码模式

```python
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Protocol
from uuid import uuid4


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass(slots=True)
class Job:
    id: str
    name: str
    payload: dict[str, Any]
    status: JobStatus = JobStatus.PENDING
    attempts: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class QueueBackend(Protocol):
    def enqueue(self, job: Job) -> None:
        ...


def schedule_export(queue: QueueBackend, user_id: str) -> Job:
    job = Job(
        id=str(uuid4()),
        name="export-report",
        payload={"user_id": user_id},
    )
    queue.enqueue(job)
    return job
```
