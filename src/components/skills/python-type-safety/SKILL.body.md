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

## 反模式

### FAIL: Any 当默认值

```python
def process(data: Any) -> Any:
    return data["key"]  # 类型检查通过，但运行时 data 可能不是 dict
```

### PASS: 用具体类型表达约束

```python
from typing import TypedDict

class Payload(TypedDict):
    key: str

def process(data: Payload) -> str:
    return data["key"]  # 编译器知道 data 有 key 且是 str
```

### FAIL: 用继承代替 Protocol

```python
class Sendable(ABC):  # 强迫所有实现继承这个基类
    @abstractmethod
    def send(self, msg: str) -> None: ...
```

### PASS: 用 Protocol 做结构化约束

```python
class Sendable(Protocol):  # 任何有 send 方法的类都匹配
    def send(self, msg: str) -> None: ...
```
