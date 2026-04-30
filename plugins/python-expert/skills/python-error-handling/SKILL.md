---
name: python-error-handling
description: 当用户要设计 Python 异常层级、输入校验、部分失败治理或规范 try/except 纪律时使用。
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

### FAIL: 吞异常返回 None

```python
def get_user(user_id: str) -> User | None:
    try:
        return db.query(User, user_id)
    except Exception:
        return None  # 网络超时？权限不足？数据损坏？全变成"没找到"
```

### PASS: 按类型分别处理

```python
def get_user(user_id: str) -> User:
    try:
        return db.query(User, user_id)
    except NotFoundError:
        raise UserNotFoundError(user_id) from None
    except DatabaseError as e:
        logger.error("db error fetching user", extra={"user_id": user_id})
        raise ServiceUnavailableError("database error") from e
```

### FAIL: 第三方异常直接暴露

```python
def create_payment(charge_request: dict[str, object]) -> dict[str, str]:
    try:
        charge_card(charge_request)
        return {"status": "ok"}
    except stripe.error.CardError as e:
        return {"error": str(e)}  # 泄露 Stripe 内部错误格式
```

### PASS: 映射到应用层错误

```python
def create_payment(charge_request: dict[str, object]) -> dict[str, str]:
    try:
        charge_card(charge_request)
        return {"status": "ok"}
    except stripe.error.CardError:
        return {"error": "payment_failed", "message": "Card was declined"}
```
