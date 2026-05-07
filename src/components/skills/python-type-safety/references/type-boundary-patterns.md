## 代码模式

```python
from typing import Protocol, TypeGuard, TypedDict


class UserPayload(TypedDict):
    id: str
    email: str


class SupportsEmail(Protocol):
    email: str


def has_email(value: object) -> TypeGuard[SupportsEmail]:
    return hasattr(value, "email") and isinstance(getattr(value, "email"), str)


def recipient_of(value: UserPayload | object) -> str:
    if isinstance(value, dict):
        return value["email"]
    if has_email(value):
        return value.email
    raise TypeError("email field is required")
```
