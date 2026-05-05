# Windows UI Automation 进阶模式

## 会话拆分原则

- 会话分四段：定位目标、读取状态、执行动作、验证结果。
- 每段都应能独立超时、独立记录日志、独立失败回退。
- 优先复用同一份策略对象，不要把超时、重试、速率限制散落在多个函数里。

## 重试预算建模

```python
from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 5
    interval_seconds: float = 0.2


def bounded_retry(policy: RetryPolicy, operation: Callable[[], T]) -> T:
    last_error = None
    for _ in range(policy.max_attempts):
        try:
            return operation()
        except RuntimeError as error:
            last_error = error
    raise RuntimeError("重试预算耗尽") from last_error
```

## 适用提示

- 元素路径稳定时优先 `AutomationId + 控件类型`，窗口标题只用于粗定位。
- 多屏场景先确定目标窗口是否可见，再决定是否滚动、切屏或请求人工确认。
- 截图、剪贴板、OCR 都视为信息外流面，必须先做脱敏策略。
