> 通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 [testing-patterns](testing-expert:testing-patterns)。本 skill 只覆盖 Python 特有语法与工具。

## 适用场景

- 为 Python 模块补单元测试、集成测试和回归测试。
- 需要设计 fixture、mock、参数化测试和失败路径覆盖。
- 需要把异步代码、数据库、文件系统或外部 API 测试做干净隔离。
- 更完整的 async、monkeypatch、临时目录和 property-based 示例见 [references/advanced-patterns.md](references/advanced-patterns.md)。
- 失败路径设计和断言策略时，联动 [python-error-handling](../python-error-handling/SKILL.md)。
- 异步测试组织方式时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。

## 核心约束

- 单元测试优先测边界和业务规则，不要把 pytest 框架细节当成主要断言对象。

## 代码模式

```python
from dataclasses import dataclass

import pytest


@dataclass(slots=True)
class Calculator:
    factor: int = 1

    def multiply(self, value: int) -> int:
        return value * self.factor


@pytest.fixture
def calc() -> Calculator:
    return Calculator(factor=3)


@pytest.mark.parametrize(("value", "expected"), [(1, 3), (2, 6), (-1, -3)])
def test_multiply(calc: Calculator, value: int, expected: int) -> None:
    assert calc.multiply(value) == expected
```

## 检查清单

- 测试数据是否最小化且易读，不靠魔法常量撑着。

## 反模式

### FAIL: 全 mock 测到 mock 自己

```python
def test_create_order():
    repo = Mock(); repo.save.return_value = Order(id="1")
    svc = OrderService(repo, Mock())
    assert svc.create({"item": "X"}).id == "1"  # 只验证 mock 返回值
```

### PASS: 隔离外部，真实业务

```python
def test_create_order(in_memory_db):
    svc = OrderService(SqlOrderRepo(in_memory_db), FakeSender())
    result = svc.create({"item": "X", "qty": 2})
    assert result.total == 200  # 验证真实业务规则
    assert in_memory_db.count("orders") == 1
```

### FAIL: 低信息量断言

```python
def test_calculate(): assert calculate(items)  # 只 truthy
```

### PASS: 具体断言

```python
def test_calculate_sums_active_items():
    result = calculate([Item(10, active=True), Item(5, active=False)])
    assert result.total == 10
    assert result.skipped_count == 1
```

### FAIL: 只测 happy path

```python
def test_parse_valid(): assert parse("1") == 1
```

### PASS: 覆盖边界 + 错误

```python
@pytest.mark.parametrize("bad", ["", "abc", None, "1.5"])
def test_parse_invalid_raises(bad):
    with pytest.raises(ValueError): parse(bad)
```
