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
