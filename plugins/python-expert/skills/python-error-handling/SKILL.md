---
name: python-error-handling
description: 当用户要做输入校验、异常分层、批处理部分失败治理、边界错误映射或提升 Python 稳定性时使用。
---

# Python 错误处理

## 适用场景

- API、CLI、任务 worker 需要稳定处理坏输入和外部依赖失败。
- 需要建立统一异常层级、错误码和用户可见错误映射。
- 批处理场景要区分“全部失败”和“部分失败”。
- 需要用类型把错误边界表达得更清楚时，联动 [python-type-safety](../python-type-safety/SKILL.md)。
- 需要给错误路径补日志和指标时，联动 [python-observability](../python-observability/SKILL.md)。
- 需要为失败场景补回归用例时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。

## 核心约束

- 先定义错误边界，再写 `try/except`；不要一上来就全局兜底。
- 只捕获你能处理的异常类型；其余异常应该保留堆栈并继续抛出。
- 用户可见消息与内部调试细节分离，避免把原始异常直接暴露到接口层。
- 验证错误、业务错误、外部系统错误要分层，不要全塞进 `ValueError`。
- 批处理要支持部分失败汇总，不要因为一个坏数据把整个批次直接打掉。

## 代码模式

```python
from dataclasses import dataclass
from typing import Any


class AppError(Exception):
    """应用层基类异常。"""


class ValidationError(AppError):
    """输入不合法。"""


class ExternalServiceError(AppError):
    """外部依赖失败。"""


@dataclass(slots=True)
class ErrorResponse:
    code: str
    message: str
    details: dict[str, Any] | None = None


def parse_positive_int(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValidationError("count must be an integer") from exc

    if value <= 0:
        raise ValidationError("count must be positive")

    return value


def to_error_response(error: AppError) -> ErrorResponse:
    if isinstance(error, ValidationError):
        return ErrorResponse(code="invalid_input", message=str(error))
    return ErrorResponse(code="internal_error", message="internal server error")
```

## 检查清单

- 是否定义了清晰的异常层级和边界映射。
- 是否只捕获可恢复错误，而不是用裸 `except Exception` 包一切。
- 错误信息是否既能让用户理解，又不会泄露内部实现细节。
- 批处理是否保留了成功项、失败项和失败原因。
- 日志里是否保留了根因堆栈和必要上下文。

## 反模式

- `except Exception: return None`。
- 用错误码当正常分支控制流。
- 直接把第三方 SDK 的异常原样暴露给最终用户。
- 同一个模块里混用 `None`、布尔值、异常三套失败约定。
- 只补成功路径测试，不补失败路径。
