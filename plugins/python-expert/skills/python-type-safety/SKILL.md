---
name: python-type-safety
description: 当用户要为 Python 代码补类型注解、Protocol、TypedDict、泛型、TypeGuard 或配置 mypy/pyright 严格模式时使用。
---

# Python 类型安全

## 适用场景

- 给既有代码补类型，降低运行前才暴露的低级错误。
- 设计库接口、仓储接口、DTO、事件对象和跨层边界类型。
- 需要在继承、协议、联合类型和类型缩窄之间做选择。
- 结构设计和边界拆分时，联动 [python-design-patterns](../python-design-patterns/SKILL.md)。
- 失败类型和错误边界建模时，联动 [python-error-handling](../python-error-handling/SKILL.md)。
- 需要为类型守卫和泛型逻辑补测试时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。

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

- 把 `Any` 当默认值，最后等于没写类型。
- 为了让类型检查通过而到处 `cast()`。
- 用继承强行表达结构约束，本该是 `Protocol` 却写成基类。
- 只写参数类型，不写返回值和容器元素类型。
- 把类型系统当业务规则系统，结果既难读也不可靠。
