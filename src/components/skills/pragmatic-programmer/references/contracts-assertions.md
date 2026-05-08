# 契约设计与断言式编程

通过契约和断言使假设显式化的深度参考。当需要关于防御性编程、尽早崩溃策略或形式化的前置条件/后置条件模式方面的指导时加载。

## 目录
1. [契约设计（DBC）](#契约设计dbc)
2. [前置条件](#前置条件)
3. [后置条件](#后置条件)
4. [类不变量](#类不变量)
5. [动态语言中的 DBC](#动态语言中的-dbc)
6. [断言式编程](#断言式编程)
7. [死程序不说谎](#死程序不说谎)
8. [断言 vs 错误处理](#断言-vs-错误处理)

---

## 契约设计（DBC）

契约设计由 Bertrand Meyer 为 Eiffel 编程语言形式化，但该原则普遍适用。每个函数或方法都有一个契约：

- **前置条件：** 在调用该例程前必须为真的条件（调用者的责任）
- **后置条件：** 该例程保证在完成后将为真的条件（例程的责任）
- **类不变量：** 在方法调用之间对象的始终为真的状态条件

### 契约隐喻

把函数想象成一份商业合同：

> "如果你向我提供有效的输入（前置条件），我保证产生正确的输出（后置条件），并将所有内容保持在一致的状态（不变量）。"

如果调用者违反了前置条件，契约就失效了——例程不承担任何责任。如果例程违反了后置条件，那是例程中的 bug。如果不变量被违反，系统处于无效状态，应停止。

### 契约为何重要

| 没有契约 | 有契约 |
|------------------|---------------|
| 函数静默接受错误输入 | 错误输入在边界处被立即捕获 |
| Bug 从其源头远处传播 | Bug 在违反点被检测到 |
| 调试需要层层追踪 | 堆栈跟踪直接指向违反的契约 |
| 假设是隐式的且未记录 | 假设是显式的且被强制执行 |
| 测试必须猜测有效的输入范围 | 契约记录了有效的输入范围 |

---

## 前置条件

前置条件定义了调用函数时必须为真的条件。满足前置条件是**调用者的责任**。

### 跨语言示例

**Python：**
```python
def transfer_funds(from_account, to_account, amount):
    # 前置条件
    assert amount > 0, f"转账金额必须为正数，实际为 {amount}"
    assert from_account.balance >= amount, (
        f"余额不足：balance={from_account.balance}, amount={amount}"
    )
    assert from_account.id != to_account.id, "不能转账到同一账户"

    # 实现
    from_account.balance -= amount
    to_account.balance += amount
```

**TypeScript：**
```typescript
function transferFunds(from: Account, to: Account, amount: number): void {
  // 前置条件
  if (amount <= 0) throw new PreconditionError(`金额必须为正数：${amount}`);
  if (from.balance < amount) throw new PreconditionError(`余额不足`);
  if (from.id === to.id) throw new PreconditionError(`不能自我转账`);

  from.balance -= amount;
  to.balance += amount;
}
```

### 前置条件指南

| 指南 | 理由 |
|-----------|-----------|
| 在函数开头检查前置条件 | 在任何副作用前快速失败 |
| 使用描述性错误消息 | 包含实际值以便立即调试 |
| 不要静默修正错误输入 | 如果金额为负，不要取反——直接崩溃 |
| 在函数的文档字符串中记录前置条件 | 调用者需要知道要求是什么 |
| 前置条件应该廉价检查 | 如果验证代价高，说明设计有问题 |

### 好的前置条件的特点

前置条件应该是：
- **可验证：** 可以通过程序检查
- **已记录：** 调用者可以阅读并理解
- **最小化：** 仅包含真正必要的条件，不过度限制
- **稳定：** 在版本间不改变（它是契约的一部分）

---

## 后置条件

后置条件定义了函数在成功完成后保证什么。满足后置条件是**例程的责任**。

### 示例

**Python：**
```python
def sort_list(items: list) -> list:
    result = sorted(items)

    # 后置条件
    assert len(result) == len(items), "排序必须保持长度不变"
    assert all(result[i] <= result[i+1] for i in range(len(result)-1)), (
        "结果必须已排序"
    )
    assert set(result) == set(items), "排序必须保持元素不变"

    return result
```

**Go：**
```go
func Divide(a, b float64) float64 {
    // 前置条件
    if b == 0 {
        panic("division by zero")
    }

    result := a / b

    // 后置条件
    if math.Abs(result*b - a) > 1e-10 {
        panic(fmt.Sprintf("postcondition failed: %f * %f != %f", result, b, a))
    }

    return result
}
```

### 后置条件模式

| 模式 | 检查项 | 示例 |
|---------|---------------|---------|
| **保持性** | 输出保持了输入的某种属性 | 排序后的列表与输入长度相同 |
| **计算性** | 结果满足数学关系 | `sqrt(x) * sqrt(x) ≈ x` |
| **状态变化** | 对象状态正确变化 | 账户余额减少了确切的转账金额 |
| **无副作用** | 未发生非预期的变化 | 转账后其他账户余额不变 |
| **返回类型** | 结果具有预期的结构 | API 响应包含必填字段 |

---

## 类不变量

不变量是在方法调用之间类每个实例都必须始终为真的条件（在方法执行期间可能暂时为假）。

### 示例

```python
class BankAccount:
    def __init__(self, owner: str, initial_balance: float = 0):
        assert initial_balance >= 0, "初始余额不能为负"
        self.owner = owner
        self._balance = initial_balance
        self._check_invariant()

    def _check_invariant(self):
        """类不变量：余额永远不为负。"""
        assert self._balance >= 0, (
            f"不变量违反：balance={self._balance} for account {self.owner}"
        )

    def deposit(self, amount: float):
        assert amount > 0, f"存款必须为正数：{amount}"  # 前置条件
        self._balance += amount
        self._check_invariant()

    def withdraw(self, amount: float):
        assert 0 < amount <= self._balance, (  # 前置条件
            f"无效取款：amount={amount}, balance={self._balance}"
        )
        self._balance -= amount
        self._check_invariant()

    @property
    def balance(self) -> float:
        return self._balance
```

### 常见不变量模式

| 领域 | 不变量 |
|--------|-----------|
| **金融** | 余额 >= 0（或 >= 透支限额） |
| **集合** | 大小 >= 0 且与实际元素计数匹配 |
| **连接池** | 活跃 + 空闲 = 总分配数 |
| **状态机** | 当前状态是已定义状态之一 |
| **树结构** | 每个子节点恰好有一个父节点（根节点除外） |
| **排序容器** | 每次变异后元素有序 |

---

## 动态语言中的 DBC

Python、JavaScript 和 Ruby 等语言缺乏内置契约支持，但可以通过模式实现：

### 守卫子句

最常见的模式——在每个函数顶部检查前置条件：

```python
def process_order(order):
    if not order:
        raise ValueError("订单不能为 None")
    if not order.items:
        raise ValueError("订单必须至少有一个商品")
    if order.total <= 0:
        raise ValueError(f"订单总额必须为正数：{order.total}")

    # 后续正常路径...
```

### 基于装饰器的契约（Python）

```python
from functools import wraps

def requires(condition_fn, message):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not condition_fn(*args, **kwargs):
                raise PreconditionError(message)
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def ensures(condition_fn, message):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            result = fn(*args, **kwargs)
            if not condition_fn(result):
                raise PostconditionError(message)
            return result
        return wrapper
    return decorator

@requires(lambda x: x >= 0, "输入必须非负")
@ensures(lambda r: r >= 0, "结果必须非负")
def sqrt(x):
    return x ** 0.5
```

### TypeScript 运行时验证

```typescript
import { z } from 'zod';

const TransferInput = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
});

function transferFunds(input: unknown) {
  // 通过 schema 验证的前置条件
  const { fromAccountId, toAccountId, amount } = TransferInput.parse(input);

  // ...实现
}
```

---

## 断言式编程

断言式编程将 DBC 扩展为通用哲学：**如果某事"不可能发生"，用断言来确保它不会发生。**

### "不可能发生"原则

每次你认为"这不可能发生"时，添加一条断言：

```python
def get_day_name(day_number):
    match day_number:
        case 1: return "Monday"
        case 2: return "Tuesday"
        case 3: return "Wednesday"
        case 4: return "Thursday"
        case 5: return "Friday"
        case 6: return "Saturday"
        case 7: return "Sunday"
        case _:
            assert False, f"无效天数编号：{day_number}"  # "不可能发生"
```

### 断言放置指南

| 位置 | 断言什么 |
|----------|---------------|
| **函数入口** | 参数的前置条件 |
| **函数出口** | 返回值的后置条件 |
| **外部调用后** | 响应符合预期格式 |
| **switch/match 默认分支** | "不可能"的情况 |
| **复杂计算后** | 中间结果的合理性检查 |
| **状态变更后** | 类不变量仍然成立 |

### 断言应该留在生产环境中吗？

**是的，但有注意事项。** 实用主义方法：

1. **保留捕获损坏问题的断言** —— 负的银行余额、无效状态转换、数据完整性违规
2. **移除对性能关键的断言** —— 仅在对基准测试证明它们确实重要之后
3. **永远不要仅仅因为"它们拖慢速度"而移除断言** —— 先测量
4. **如果性能确实受影响，用更廉价的近似值替换昂贵的断言**

---

## 死程序不说谎

最重要的实用主义原则之一：**在故障点崩溃的程序远比在无效状态下苟延残喘的程序安全得多。**

### 为什么崩溃比继续运行更好

| 行为 | 后果 |
|----------|------------|
| 在无效状态时崩溃 | Bug 在源头被找到，堆栈跟踪指向问题 |
| 记录警告并继续 | 无效状态传播、损坏数据、数小时后才发现 |
| 静默忽略错误 | 数据丢失、安全漏洞、神秘的下游故障 |
| 返回默认值 | 调用者不知道出了问题，基于错误数据做出决策 |

### 示例：静默损坏问题

```python
# 危险：静默处理错误数据
def get_user_age(user_data):
    try:
        return int(user_data.get("age", 0))
    except (ValueError, TypeError):
        return 0  # 对无效数据静默返回 0

# 更好：对错误数据崩溃
def get_user_age(user_data):
    age = user_data["age"]  # 如缺失则 KeyError
    if not isinstance(age, int) or age < 0:
        raise ValueError(f"无效年龄：{age}")
    return age
```

第一个版本会愉快地处理年龄为 0 的用户，使他们不符合年龄限制功能的资格，因为数据被静默损坏了。第二个版本立即暴露问题。

---

## 断言 vs 错误处理

这是一个许多开发人员混淆的关键区别：

| 方面 | 断言 | 错误处理 |
|--------|-----------|---------------|
| **用于** | 应该 NEVER 发生的事 | 可能 MIGHT 发生的事 |
| **示例** | 非空字段中的空指针、负数数组索引 | 网络超时、文件未找到、无效用户输入 |
| **响应** | 立即崩溃 | 优雅恢复 |
| **在生产环境** | 保留（它们表示 bug） | 必需（它们处理预期的故障） |
| **消息受众** | 开发人员（调试） | 用户或调用代码（错误恢复） |

### 决策指南

```
用户能否通过正常使用导致此情况？
  → 错误处理（验证输入，显示友好消息）

如果发生，这是代码中的 bug？
  → 断言（以开发人员友好的消息崩溃）

系统能否有意义地恢复？
  → 错误处理（重试、回退、降级）

恢复是否只是"假装没发生过"？
  → 断言（不要用错误处理隐藏 bug）

这是外部系统故障（网络、磁盘、API）？
  → 错误处理（这些在生产环境中是预期的）

这是内部不变量的违反吗？
  → 断言（系统处于无效状态）
```

实用主义程序员恰当地使用两种工具：断言用于"这永远不该发生"，错误处理用于"这可能会发生。"最糟糕的方法是什么都不做——静默忽略问题并寄希望于最好。
