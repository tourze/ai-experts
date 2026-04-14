---
name: python-testing-patterns
description: 当用户要用 pytest 编写单元测试、集成测试、fixture、mock、参数化测试或异步测试时使用。
---

# Python 测试模式

## 适用场景

- 为 Python 模块补单元测试、集成测试和回归测试。
- 需要设计 fixture、mock、参数化测试和失败路径覆盖。
- 需要把异步代码、数据库、文件系统或外部 API 测试做干净隔离。
- 更完整的 async、monkeypatch、临时目录和 property-based 示例见 [references/advanced-patterns.md](references/advanced-patterns.md)。
- 失败路径设计和断言策略时，联动 [python-error-handling](../python-error-handling/SKILL.md)。
- 异步测试组织方式时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。

## 核心约束

- 默认采用 AAA（Arrange / Act / Assert）结构。
- 单元测试优先测边界和业务规则，不要把框架细节当成主要断言对象。
- fixture 负责复用稳定 setup，不要在 fixture 里偷偷塞复杂业务逻辑。
- mock 只截断外部依赖，不要把被测逻辑自身也 mock 掉。
- 成功路径、失败路径、边界值和回归场景都要显式覆盖。

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

- 测试命名是否直接表达场景和预期结果。
- 是否覆盖正常、异常、边界和回归四类核心路径。
- 测试数据是否最小化且易读，不靠魔法常量撑着。
- fixture 生命周期是否合理，没有制造隐式共享状态。
- 断言是否足够具体，失败时能快速定位问题。

## 反模式

- 只有 happy path，没有坏输入和异常断言。
- 把所有东西都 mock 掉，最后只测到 mock 自己。
- fixture 巨大且跨文件共享副作用，导致测试互相污染。
- 断言写成 `assert result` 这类低信息量表达。
- 为了追求覆盖率写一堆不表达业务价值的空洞测试。
