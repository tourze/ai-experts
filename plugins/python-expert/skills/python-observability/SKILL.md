---
name: python-observability
description: 当用户要给 Python 服务补结构化日志、指标、trace、请求上下文和故障定位能力时使用。
---

# Python 可观测性

## 适用场景

- API、worker、定时任务需要补日志、指标和链路追踪。
- 线上问题只能“猜”，需要把请求上下文和耗时显式打出来。
- 需要统一日志字段、trace ID、错误标签和关键业务指标。
- 异步链路上下文透传时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。
- 后台任务监控和重试治理时，联动 [python-background-jobs](../python-background-jobs/SKILL.md)。
- 需要把失败路径覆盖进测试时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。

## 核心约束

- 默认使用结构化日志，不依赖随手 `print()`。
- 日志键名要稳定，例如 `event`、`request_id`、`elapsed_ms`，不要一处一个命名。
- 指标和 trace 要围绕边界事件布点，不要在纯函数内部滥打点。
- 严禁记录密码、token、身份证号等敏感数据。
- 错误日志必须带足够上下文，但不能把整份大对象原样倾倒进日志。

## 代码模式

```python
import logging
import time
from contextlib import contextmanager


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orders")


@contextmanager
def timed(operation: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("event=%s elapsed_ms=%.2f", operation, elapsed_ms)


def create_order(order_id: str, customer_id: str) -> None:
    with timed("order.create"):
        logger.info(
            "event=order.create.started order_id=%s customer_id=%s",
            order_id,
            customer_id,
        )
        logger.info("event=order.create.finished order_id=%s", order_id)
```

## 检查清单

- 每条关键链路都能定位到请求入口、外部调用和失败位置。
- 日志字段在不同模块中保持一致，便于检索和聚合。
- 指标覆盖了吞吐、延迟、错误率和关键队列长度。
- trace/span 的边界与真实业务边界一致，而不是随手乱切。
- 敏感字段已脱敏或根本不写入日志。

## 反模式

### FAIL: 自然语言 + 无字段

```python
logger.info(f"用户 {user.name} 成功下单，花了 {total} 块钱")
# 无法按字段聚合，grep 只能匹配字面
```

### PASS: 结构化字段

```python
logger.info(
    "event=order.created user_id=%s total=%.2f request_id=%s",
    user.id, total, ctx.request_id,
)
```

### FAIL: 失败只打 str(error)

```python
try:
    pay(order)
except Exception as e:
    logger.error(f"失败了: {e}")  # 无堆栈、无上下文
```

### PASS: 堆栈 + 业务标签

```python
try:
    pay(order)
except PaymentError as e:
    logger.error(
        "event=payment.failed order_id=%s code=%s",
        order.id, e.code, exc_info=True,
    )
```
