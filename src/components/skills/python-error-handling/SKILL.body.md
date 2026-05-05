通用错误处理原则（三层模型、重试边界、部分失败）见 architecture-expert 的 error-handling-patterns skill。

联动：[python-type-safety](../python-type-safety/SKILL.md) · [python-observability](../python-observability/SKILL.md) · [python-testing-patterns](../python-testing-patterns/SKILL.md)

## 核心约束

- 先定义错误边界，再写 `try/except`；不要一上来就全局兜底。
- 只捕获你能处理的异常类型；其余异常保留堆栈继续抛出。
- 验证错误、业务错误、外部系统错误要分层，不要全塞进 `ValueError`。

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
- 只捕获可恢复错误。
- 错误信息不泄露内部实现细节。
- 批处理保留了成功项、失败项和失败原因。

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
except stripe.error.CardError as e:
    return {"error": str(e)}  # 泄露 Stripe 内部错误格式
```

### PASS: 映射到应用层错误

```python
except stripe.error.CardError:
    return {"error": "payment_failed", "message": "Card was declined"}
```
