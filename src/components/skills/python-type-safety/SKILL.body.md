## 核心约束

- 公共 API 先标注参数、返回值和重要属性，再逐步推进到内部实现。
- 优先用 `Protocol`、`TypedDict`、`TypeGuard`、泛型表达真实边界，少用 `Any`。
- 类型检查不能替代运行时校验；外部输入仍然需要验证。
- 严格模式要渐进接入，但新增代码默认不接受裸 `Any`。
- 类型注解应帮助读代码，不要为了“炫技”造难懂的类型体操。

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

## 检查清单

- 所有公共函数和类是否具备明确签名。
- 可空值、联合类型和边界输入是否被显式表达。
- `Any`、`cast()` 和 `type: ignore` 是否都有合理解释。
- 类型检查规则是否进入 CI，而不是只在本地偶尔运行。
- 运行时校验与静态类型是否保持一致，没有彼此打架。

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
