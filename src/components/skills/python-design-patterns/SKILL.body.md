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
