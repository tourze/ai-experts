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
