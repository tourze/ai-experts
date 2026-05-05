# Python 设计模式

## 适用场景

- 新建 service、repository、adapter 等核心组件时需要先定边界。
- 现有类已经变成 God object，职责缠绕、难测、难改。
- 需要在继承、组合、协议、工具函数之间做取舍。

通用架构原则（分层、组合优于继承、构造注入、薄控制器）见 architecture-expert 的 software-design skill。

需要补齐类型约束时联动 [python-type-safety](../python-type-safety/SKILL.md)；补测试时联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)；边界错误表达联动 [python-error-handling](../python-error-handling/SKILL.md)。

## 核心约束

- 依赖注入用 `Protocol` 或 ABC 定义接口，构造函数注入实现。
- 组合优先于继承；共享几行代码用 mixin 或注入而非继承叠基类。
- 用 `@dataclass(slots=True)` 或 `NamedTuple` 做不可变 DTO。

## 代码模式

```python
from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class User:
    id: str
    email: str


class UserRepository(Protocol):
    def get(self, user_id: str) -> User | None:
        ...


class EmailSender(Protocol):
    def send(self, recipient: str, subject: str, body: str) -> None:
        ...


class WelcomeService:
    def __init__(self, repo: UserRepository, sender: EmailSender) -> None:
        self._repo = repo
        self._sender = sender

    def run(self, user_id: str) -> None:
        user = self._repo.get(user_id)
        if user is None:
            raise LookupError(f"user {user_id} not found")
        self._sender.send(user.email, "欢迎加入", "账号已创建")
```

## 检查清单

- 一个类是否只有一个主要变化原因。
- I/O 能否被替身替换，从而让业务逻辑单测独立运行。
- 抽象层是否真正减少了重复。
- 模块之间是否只暴露最小接口。

## 反模式

### FAIL: 继承叠基类复用几行

```python
class BaseRepo:
    def _log(self, msg): print(msg)
class UserRepo(BaseRepo): ...
class OrderRepo(BaseRepo): ...
# 为了共享 _log 一个方法，全部继承
```

### PASS: 组合注入

```python
class Logger(Protocol):
    def log(self, msg: str) -> None: ...
class UserRepo:
    def __init__(self, logger: Logger) -> None: self._logger = logger
```

### FAIL: 构造函数参数爆炸

```python
class OrderService:
    def __init__(self, user_repo, product_repo, inventory_repo, payment_repo,
                 email, sms, analytics, audit, tax, shipping, discount): ...
# 11 个依赖 → 职责失控
```

### PASS: 按领域拆分

```python
class OrderPricing: ...       # 定价
class OrderFulfillment: ...   # 履约
class OrderNotification: ...  # 通知
```
