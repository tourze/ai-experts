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
