# 简化条件逻辑

驯服复杂条件结构的重构详解。条件语句是最难阅读的代码，也是最可能隐藏 bug 的地方。这些重构将条件分解、合并，并用更清晰的替代方案替换条件语句。

---

## 分解条件表达式（Decompose Conditional）

将复杂条件语句的条件判断、then 分支和 else 分支提取为命名恰当的方法。

### 动机

一个带有复合条件和多行分支的长 `if` 语句迫使读者在脑海中模拟每条路径。通过命名每个部分，你将条件语句转化为可读的散文。

### 操作步骤

1. 将条件判断提取为一个以含义命名的方法（而非机制）
2. 将 then 体提取为一个描述其作用的方法
3. 将 else 体提取为一个描述其作用的方法
4. 运行测试

### 示例

**之前：**
```javascript
function calculateCharge(date, quantity, plan) {
  let charge;
  if (date.getMonth() >= 6 && date.getMonth() <= 8) {
    charge = quantity * plan.summerRate;
  } else {
    charge = quantity * plan.regularRate + plan.regularServiceCharge;
  }
  return charge;
}
```

**之后：**
```javascript
function calculateCharge(date, quantity, plan) {
  if (isSummer(date)) {
    return summerCharge(quantity, plan);
  } else {
    return regularCharge(quantity, plan);
  }
}

function isSummer(date) {
  return date.getMonth() >= 6 && date.getMonth() <= 8;
}

function summerCharge(quantity, plan) {
  return quantity * plan.summerRate;
}

function regularCharge(quantity, plan) {
  return quantity * plan.regularRate + plan.regularServiceCharge;
}
```

### 命名条件判断

| 条件表达式 | 好的命名 |
|---------------------|-----------|
| `date.getMonth() >= 6 && date.getMonth() <= 8` | `isSummer(date)` |
| `user.age >= 18 && user.hasConsent` | `isEligible(user)` |
| `cart.total > 100 && !cart.hasPromo` | `qualifiesForDiscount(cart)` |
| `retries < MAX && !response.ok` | `shouldRetry(retries, response)` |
| `file.size > 0 && file.ext === '.csv'` | `isValidUpload(file)` |

条件名应使用领域术语回答一个是/否问题。

---

## 合并条件表达式（Consolidate Conditional Expression）

将一系列指向相同结果的条件检查组合为一个具有描述性名称的单一条件。

### 动机

当多个条件返回相同的值时，将它们组合成一个有名称的检查会使逻辑更清晰："所有这些都意味着同一件事——这种情况是 X。"

### 操作步骤

1. 确认所有条件表达式都没有副作用
2. 使用逻辑运算符（`&&`、`||`）进行组合
3. 将组合后的条件提取为一个命名方法
4. 运行测试

### 示例

**之前：**
```python
def disability_amount(employee):
    if employee.seniority < 2:
        return 0
    if employee.months_disabled > 12:
        return 0
    if employee.is_part_time:
        return 0
    # compute disability amount...
    return base_amount * 1.5
```

**之后：**
```python
def disability_amount(employee):
    if is_not_eligible_for_disability(employee):
        return 0
    return base_amount * 1.5

def is_not_eligible_for_disability(employee):
    return (employee.seniority < 2
            or employee.months_disabled > 12
            or employee.is_part_time)
```

### 何时合并 vs. 保持分离

| 场景 | 操作 |
|-----------|--------|
| 所有条件意味着相同的业务概念 | 合并为一个命名检查 |
| 条件独立且有不同的原因 | 保持分离（每个值得有自己的名字） |
| 条件应按顺序评估以优化性能 | 为短路清晰性保持分离 |

---

## 以卫语句取代嵌套条件表达式（Replace Nested Conditional with Guard Clauses）

将特殊情况或边缘条件放在方法顶部并使用提前返回，使主要执行路径保持扁平且无缩进。

### 动机

深度嵌套的 `if/else` 结构掩盖了正常路径。卫语句清楚地表明："这些是边缘情况。现在这是主要逻辑。" 主路径以最低的缩进级别运行。

### 操作步骤

1. 识别每个边缘情况或特殊条件
2. 将其移到方法顶部，作为 `if (condition) return earlyValue;`
3. 移除对应的 `else` 并减少缩进
4. 运行测试

### 示例

**之前：**
```javascript
function payAmount(employee) {
  let result;
  if (employee.isSeparated) {
    result = { amount: 0, reasonCode: 'SEP' };
  } else {
    if (employee.isRetired) {
      result = { amount: 0, reasonCode: 'RET' };
    } else {
      // main calculation
      result = {
        amount: employee.salary * employee.rate,
        reasonCode: 'REG'
      };
    }
  }
  return result;
}
```

**之后：**
```javascript
function payAmount(employee) {
  if (employee.isSeparated) return { amount: 0, reasonCode: 'SEP' };
  if (employee.isRetired) return { amount: 0, reasonCode: 'RET' };

  return {
    amount: employee.salary * employee.rate,
    reasonCode: 'REG'
  };
}
```

### 卫语句模式

| 模式 | 示例 |
|---------|---------|
| 空值检查 | `if (input == null) return defaultValue;` |
| 空集合检查 | `if (items.length === 0) return [];` |
| 权限检查 | `if (!user.canEdit) throw new ForbiddenError();` |
| 边界检查 | `if (index < 0 || index >= size) throw new RangeError();` |
| 状态检查 | `if (order.isCancelled) return zeroPay();` |

### "单一返回" vs. 卫语句

一些编码规范要求每个方法只有一个 return 语句。这导致了深层嵌套的条件和临时结果变量。卫语句配合提前返回能产生更清晰、更扁平的代码。Fowler 明确推荐在处理特殊情况的场景中使用卫语句而非单一返回。

---

## 以多态取代条件表达式（Replace Conditional with Polymorphism）

将检查类型、状态或类别并分支到不同行为的条件语句替换为多态类，其中每个类型提供自己的实现。

### 动机

这是消除基于类型的条件语句的黄金标准。不是让一个函数了解每种类型，而是让每种类型了解自身。添加新类型意味着添加一个新类——而不是在多个地方编辑现有条件语句（开闭原则）。

### 操作步骤

1. 如果条件判断基于类型码，先应用将类型码替换为子类
2. 在父类中创建一个基方法（可能是抽象的）
3. 将条件语句的每个分支复制到对应的子类中作为覆盖实现
4. 从父类中移除条件语句（或使其成为默认情况）
5. 运行测试

### 示例

**之前：**
```python
class Bird:
    def __init__(self, bird_type, voltage=0, coconut_count=0):
        self.type = bird_type
        self.voltage = voltage
        self.coconut_count = coconut_count

    def speed(self):
        if self.type == 'european':
            return 35 - (self.voltage / 10)
        elif self.type == 'african':
            return 40 - (2 * self.coconut_count)
        elif self.type == 'norwegian_blue':
            return 0 if self.voltage > 100 else 10 + (self.voltage / 10)
        else:
            raise ValueError(f"Unknown bird type: {self.type}")
```

**之后：**
```python
class Bird:
    def speed(self):
        raise NotImplementedError

class EuropeanSwallow(Bird):
    def speed(self):
        return 35 - (self.voltage / 10)

class AfricanSwallow(Bird):
    def speed(self):
        return 40 - (2 * self.coconut_count)

class NorwegianBlueParrot(Bird):
    def speed(self):
        return 0 if self.voltage > 100 else 10 + (self.voltage / 10)
```

### 何时使用多态 vs. 保留条件

| 场景 | 建议 |
|-----------|-------------|
| 条件语句出现在多个方法中 | 多态——类型知道自己的行为 |
| 只有一个方法包含条件语句 | 可能过度设计——分解条件表达式可能就足够了 |
| 新类型频繁添加 | 多态——开闭原则 |
| 类型集固定且很小（例如 2-3 个） | 条件语句可能更简单 |
| 行为由运行时变化的码值决定 | 使用策略模式而非继承 |

---

## 引入特例模式（Introduce Special Case / Null Object）

不在每个调用者中检查特例（通常为空值），而是创建一个封装特例行为的类。

### 动机

散布在整个代码库中的 `if (customer == null)` 检查增加了噪音且容易被遗忘。一个 `NullCustomer` 或 `UnknownCustomer` 对象以安全的默认行为响应所有相同的方法。

### 操作步骤

1. 为特例创建一个子类或单独的类
2. 在父类或工厂中添加一个创建特例的方法（例如 `Customer.unknown()`）
3. 在特例类中使用调用者当前在空值检查后使用的默认行为实现每个方法
4. 将调用者改为使用特例对象而不是 null
5. 从调用者中移除空值检查
6. 运行测试

### 示例

**之前：**
```javascript
// Scattered throughout the codebase:
const customerName = (customer !== null) ? customer.name : 'Occupant';
const billingPlan = (customer !== null) ? customer.billingPlan : BillingPlan.basic();
const paymentHistory = (customer !== null) ? customer.paymentHistory : new NullPaymentHistory();
```

**之后：**
```javascript
class UnknownCustomer {
  get name() { return 'Occupant'; }
  get billingPlan() { return BillingPlan.basic(); }
  get paymentHistory() { return new NullPaymentHistory(); }
  get isUnknown() { return true; }
}

class Customer {
  get isUnknown() { return false; }
  // ... normal implementation
}

// Callers (no more null checks):
const customerName = customer.name;
const billingPlan = customer.billingPlan;
```

### 常见特例

| 领域 | 特例对象 | 默认行为 |
|--------|-------------------|------------------|
| 客户 | `UnknownCustomer` | 返回"Occupant"，基础方案 |
| 货币 | `NullMoney` | 零金额，无货币 |
| 日志 | `NullLogger` | 静默丢弃所有消息 |
| 权限 | `DeniedPermission` | 所有检查返回 false |
| 配置 | `DefaultConfig` | 返回合理的默认值 |
| 用户 | `AnonymousUser` | 只读，无权限 |

---

## 引入断言（Introduce Assertion）

通过插入一个断言使假设变得明确，如果假设被违反，断言将快速失败。

### 动机

断言记录了代码期望为真的内容。它们是可在开发期间捕获 bug 的可执行文档。与注释不同，断言会在运行时被验证。

### 操作步骤

1. 识别代码中的一个假设（一个应该始终为真的条件）
2. 在该假设被做出的位置插入断言
3. 确保断言没有副作用
4. 运行测试（它们应该仍然通过——如果断言失败，你发现了一个 bug）

### 示例

**之前：**
```python
def apply_discount(product, discount_rate):
    # discount should be between 0 and 1
    price = product.base_price * (1 - discount_rate)
    return price
```

**之后：**
```python
def apply_discount(product, discount_rate):
    assert 0 <= discount_rate <= 1, f"Discount rate must be 0-1, got {discount_rate}"
    price = product.base_price * (1 - discount_rate)
    return price
```

### 断言指南

| 指南 | 理由 |
|-----------|-----------|
| 决不用断言做输入验证 | 断言可以在生产环境中禁用；对不受信任的输入使用异常 |
| 对程序员错误使用断言 | 如果代码正确则绝不应发生的条件 |
| 保持断言消息的描述性 | 包含实际值和期望的约束 |
| 不要在断言中放置副作用 | `assert items.remove(x)` 在断言被禁用时失效 |

---

## 决策指南：使用哪种条件重构

| 场景 | 重构手法 |
|-----------|-------------|
| 长而复杂的条件表达式 | 分解条件表达式（Decompose Conditional） |
| 多个条件指向相同结果 | 合并条件表达式（Consolidate Conditional Expression） |
| 嵌套 if/else 包含特殊情况 | 以卫语句取代嵌套条件表达式（Replace Nested Conditional with Guard Clauses） |
| 在多个地方对类型码使用 switch/if | 以多态取代条件表达式（Replace Conditional with Polymorphism） |
| 空值检查散布各处 | 引入特例模式（Introduce Special Case / Null Object） |
| 代码逻辑中的隐藏假设 | 引入断言（Introduce Assertion） |
| 条件只出现一次，类型集很小 | 保留条件，但进行分解（Decompose） |
| 条件在运行时变化 | 使用策略模式 |
