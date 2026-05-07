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
