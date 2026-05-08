# 组合方法

将长方法拆解为命名恰当、内聚性强的片段的重构详解。这些是最常用的重构手法，也是所有代码改进的基础。

---

## 提炼方法（Extract Method）

最重要的重构手法。将一个代码片段转化为一个方法，方法名用于解释该片段的目的。

### 动机

你有一个可以组合在一起的代码片段。方法越长，就越难理解。当你看到一条注释解释下一个代码块的功能时，这就是需要提炼的信号。注释内容将成为方法名。

### 操作步骤

1. 创建一个新方法，以代码的**意图**命名（它做什么，而不是怎么做）
2. 将提炼的代码复制到新方法中
3. 检查被提炼的代码中对局部变量的引用——这些将成为参数或返回值
4. 如果某些局部变量只在被提取的代码中使用，将它们声明为新方法的局部变量
5. 将剩余的局部变量作为参数传递
6. 如果需要返回多个值，考虑返回一个对象或进一步拆分
7. 将原始代码替换为对新方法的调用
8. 运行测试

### 示例

**之前：**
```javascript
function printOwing(invoice) {
  let outstanding = 0;

  // print banner
  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");

  // calculate outstanding
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
  console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

**之后：**
```javascript
function printOwing(invoice) {
  printBanner();
  const outstanding = calculateOutstanding(invoice);
  printDetails(invoice, outstanding);
}

function printBanner() {
  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");
}

function calculateOutstanding(invoice) {
  let result = 0;
  for (const order of invoice.orders) {
    result += order.amount;
  }
  return result;
}

function printDetails(invoice, outstanding) {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
  console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

### 命名指南

| 不好的名称 | 好的名称 | 原因 |
|----------|-----------|-----|
| `doStuff()` | `calculateMonthlyTotal()` | 表达意图，而非模糊不清 |
| `process()` | `validateAndSaveOrder()` | 明确说明其功能 |
| `handleData()` | `parseCSVRow()` | 命名领域概念 |
| `helper()` | `formatCurrencyForDisplay()` | 描述转换操作 |
| `step2()` | `applyDiscountRules()` | 命名业务概念 |

**经验法则：** 如果找不到一个好名字，提炼的边界可能有问题。尝试提炼不同的片段。

---

## 内联方法（Inline Method）

提炼方法的逆操作。当方法体与其名称一样清晰，或需要重新组织结构不佳的代码时，将方法调用替换为方法体。

### 动机

有时方法体与其名称一样显而易见。没有价值的间接层就是噪声。也可作为中间步骤：先内联一个分解不当的方法，然后按更好的边界重新提炼。

### 操作步骤

1. 确认该方法不是多态的（没有子类覆盖它）
2. 找到所有调用者
3. 将每次调用替换为方法体
4. 删除原方法
5. 运行测试

### 示例

**之前：**
```python
def get_rating(self):
    return 2 if self.more_than_five_late_deliveries() else 1

def more_than_five_late_deliveries(self):
    return self.late_deliveries > 5
```

**之后：**
```python
def get_rating(self):
    return 2 if self.late_deliveries > 5 else 1
```

### 何时不应内联

- 方法名传达了代码本身无法表达的领域含义时
- 该方法被多处使用时（DRY）
- 该方法在子类中被覆盖时

---

## 提炼变量（Extract Variable）

为复杂表达式引入局部变量，使其具备自文档能力。

### 动机

表达式可能难以阅读。为子表达式命名一个恰当的变量，既可作为内联文档，也使调试更加容易。

### 操作步骤

1. 识别复杂表达式或子表达式
2. 声明一个以表达式意图命名的变量
3. 将表达式替换为该变量
4. 运行测试

### 示例

**之前：**
```javascript
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);
```

**之后：**
```javascript
const basePrice = order.quantity * order.itemPrice;
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
const shippingCap = Math.min(basePrice * 0.1, 100);
return basePrice - quantityDiscount + shippingCap;
```

---

## 内联变量（Inline Variable）

提炼变量的逆操作。当表达式同样清晰时，移除变量。

### 使用时机

- 变量名没有提供超出表达式本身的信息时
- 变量只赋值一次且只使用一次时
- 该变量阻碍了其他重构操作（例如，需要先内联它才能进行提炼方法）时

### 示例

**之前：**
```python
base_price = order.base_price()
return base_price > 1000
```

**之后：**
```python
return order.base_price() > 1000
```

---

## 以查询取代临时变量（Replace Temp with Query）

将临时变量转化为方法调用，使计算可复用，并使原方法更加简洁。

### 动机

临时变量只能在单个方法内部可见。如果其他地方需要相同的计算，就会产生重复。查询方法对整个类可见（或可提取到另一个类中）。

### 操作步骤

1. 确认该变量只赋值一次，且表达式没有副作用
2. 将赋值的右侧表达式提取为一个新方法
3. 将所有引用该临时变量的地方替换为新方法的调用
4. 移除临时变量的声明和赋值
5. 运行测试

### 示例

**之前：**
```javascript
class Order {
  getPrice() {
    const basePrice = this.quantity * this.itemPrice;
    if (basePrice > 1000) {
      return basePrice * 0.95;
    } else {
      return basePrice * 0.98;
    }
  }
}
```

**之后：**
```javascript
class Order {
  getPrice() {
    if (this.basePrice() > 1000) {
      return this.basePrice() * 0.95;
    } else {
      return this.basePrice() * 0.98;
    }
  }

  basePrice() {
    return this.quantity * this.itemPrice;
  }
}
```

### 性能说明

多次调用方法而不是缓存在临时变量中可能看似浪费。实际上，对大多数代码来说，性能影响可以忽略不计。先做性能分析再优化。重构后的代码以后更容易优化，因为热点路径已经被隔离。

---

## 拆分临时变量（Split Temporary Variable）

当一个临时变量被多次赋值（且不是循环计数器或收集变量）时，它承担了两个不同的职责。给每个职责分配独立的变量。

### 动机

一个临时变量被两次赋值用于不同目的，会误导读者认为这些赋值是相关的。每个角色都应该有自己的变量，并配以描述性的名称。

### 操作步骤

1. 重命名第一次赋值以反映其目的
2. 如有可能将其声明为 `const`/`final`
3. 找到所有使用第一次赋值的引用，确保它们使用新名称
4. 对每次后续赋值使用不同名称重复此过程
5. 运行测试

### 示例

**之前：**
```javascript
let temp = 2 * (height + width);  // perimeter
console.log(temp);
temp = height * width;            // area
console.log(temp);
```

**之后：**
```javascript
const perimeter = 2 * (height + width);
console.log(perimeter);
const area = height * width;
console.log(area);
```

---

## 移除对参数的赋值（Remove Assignments to Parameters）

永远不要在方法体内对参数进行赋值。这会混淆读者，使其不清楚该修改是否对调用者可见（在按值传递的语言中不可见；在对象引用的按值传递中，对象变异可见）。

### 操作步骤

1. 为参数创建一个新的局部变量
2. 将所有对参数的赋值替换为对新变量的赋值
3. 运行测试

### 示例

**之前：**
```python
def discount(input_val, quantity):
    if quantity > 50:
        input_val -= 2
    if quantity > 100:
        input_val -= 1
    return input_val
```

**之后：**
```python
def discount(input_val, quantity):
    result = input_val
    if quantity > 50:
        result -= 2
    if quantity > 100:
        result -= 1
    return result
```

---

## 以方法对象取代方法（Replace Method with Method Object）

当一个方法因为局部变量过于纠缠而无法提取时，将整个方法移到其自己的类中，局部变量成为该类的字段。然后你就可以自由地提取子方法了。

### 动机

有时一个长方法包含太多相互关联的局部变量，导致提炼方法不可能实现（需要传递太多参数）。通过将方法转化为自己的类，所有局部变量都成为字段，任何提取的方法都可以直接访问，无需参数传递。

### 操作步骤

1. 创建以方法目的命名的新类
2. 为原始对象以及每个局部变量和参数添加字段
3. 创建构造函数，接收原始对象和所有参数
4. 将方法体复制到 `compute()`（或类似名称）方法中
5. 将原始方法替换为：创建新对象，调用 `compute()`
6. 现在可以在新类中自由提取方法——局部变量都是字段，无需传递参数
7. 运行测试

### 示例

**之前：**
```python
class Account:
    def gamma(self, input_val, quantity, year_to_date):
        # 50 lines of tangled computation using all three params
        # plus self.fields -- too intertwined to extract
        ...
```

**之后：**
```python
class GammaCalculation:
    def __init__(self, account, input_val, quantity, year_to_date):
        self.account = account
        self.input_val = input_val
        self.quantity = quantity
        self.year_to_date = year_to_date

    def compute(self):
        # Now extract freely -- all variables are fields
        self._apply_quantity_adjustment()
        self._apply_yearly_factor()
        return self.input_val

    def _apply_quantity_adjustment(self):
        # can access self.quantity, self.input_val freely
        ...

    def _apply_yearly_factor(self):
        ...

class Account:
    def gamma(self, input_val, quantity, year_to_date):
        return GammaCalculation(self, input_val, quantity, year_to_date).compute()
```

---

## 决策指南：使用哪种组合重构

| 场景 | 重构手法 |
|-----------|-------------|
| 代码块可以按意图命名 | 提炼方法（Extract Method） |
| 方法体微不足道，名称未增加任何信息 | 内联方法（Inline Method） |
| 复杂表达式需要解释 | 提炼变量（Extract Variable） |
| 变量未提供超出表达式的含义 | 内联变量（Inline Variable） |
| 相同计算在多个方法中需要 | 以查询取代临时变量（Replace Temp with Query） |
| 一个变量服务于两个目的 | 拆分临时变量（Split Temporary Variable） |
| 参数在方法内被重新赋值 | 移除对参数的赋值（Remove Assignments to Parameters） |
| 长方法包含太多纠缠的局部变量 | 以方法对象取代方法（Replace Method with Method Object） |
