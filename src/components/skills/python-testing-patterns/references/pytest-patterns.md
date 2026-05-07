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
