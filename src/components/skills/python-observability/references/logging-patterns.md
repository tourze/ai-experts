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
