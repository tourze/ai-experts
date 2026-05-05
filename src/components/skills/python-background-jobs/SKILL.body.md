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

## 反模式

### FAIL: 请求里 await 长任务

```python
@app.post("/exports")
async def create(req):
    file = await generate_report(req)  # 5 分钟
    return {"url": file.url}
# 客户端超时，nginx 504
```

### PASS: 立即返回 job_id

```python
@app.post("/exports")
async def create(req):
    job = enqueue(req.user_id)
    return {"job_id": job.id, "status": "pending"}

@app.get("/exports/{job_id}")
async def status(job_id): return get_job(job_id)
```

### FAIL: 无业务幂等键

```python
def handle_payment(amount, user_id):
    charge_card(amount, user_id)
# worker 重启重投 → 重复扣款
```

### PASS: idempotency_key

```python
def handle_payment(amount, user_id, request_id):
    if processed_log.exists(request_id): return
    charge_card(amount, user_id, idempotency_key=request_id)
    processed_log.mark(request_id)
```

### FAIL: 无限重试

```python
@retry(forever=True)
def send_email(to): ...
# 地址错误 → 重试到天荒地老
```

### PASS: 区分错误类型

```python
@retry(max_attempts=3, retry_on=TransientError)
def send_email(to):
    try: smtp.send(to)
    except SMTPRecipientRefused:
        raise PermanentError("invalid address")  # 不重试，进死信
```
