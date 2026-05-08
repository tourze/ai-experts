# 组织数据

改进数据表示方式的重构详解。原始类型、魔法数字、暴露的字段和可变集合会产生微妙的错误并分散领域知识。这些重构用封装行为和强制执行不变量的对象来替代原始表示。

---

## 将数据值替换为对象（Replace Data Value with Object）

当原始数据项有关联的行为或验证时，将其包装在一个类中。这是治愈基本类型偏执（Primitive Obsession）的方法。

### 动机

一个数据值最初只是简单的字符串或数字。然后你添加了验证。接着是格式化。然后是比较逻辑。接着同样的验证出现在三个地方。此时，该值值得成为一个对象。

### 操作步骤

1. 为这个值创建一个类，构造函数接收原始类型
2. 在构造函数中添加验证
3. 添加任何行为方法（格式化、比较等）
4. 将字段类型从原始类型改为新类
5. 更新所有设置该字段的代码，使其创建新类的实例
6. 更新所有读取该字段的代码，使用对象的方法
7. 运行测试

### 示例

**之前：**
```javascript
class Order {
  constructor(customer) {
    this.customer = customer; // just a string name
  }
}

// Scattered validation in multiple places:
if (order.customer === '') throw new Error('no customer');
if (otherOrder.customer === '') throw new Error('no customer');
```

**之后：**
```javascript
class Customer {
  constructor(name) {
    if (!name || name.trim() === '') {
      throw new Error('Customer name is required');
    }
    this._name = name.trim();
  }

  get name() { return this._name; }

  equals(other) {
    return other instanceof Customer && this._name === other._name;
  }
}

class Order {
  constructor(customer) {
    this.customer = new Customer(customer);
  }
}
```

### 常见的基本类型到对象升级

| 原始类型 | 对象 | 获得的行为 |
|-----------|--------|-------------------|
| `String email` | `EmailAddress` | 格式验证、域提取 |
| `number cents` | `Money` | 货币、舍入规则、算术运算 |
| `String phone` | `PhoneNumber` | 格式化、国家代码解析 |
| `number lat, number lng` | `Coordinates` | 距离计算、验证 |
| `String startDate, String endDate` | `DateRange` | 包含、重叠、时长 |
| `number celsius` | `Temperature` | 单位转换、比较 |
| `String hex` | `Color` | 解析、明度、对比度 |
| `number status` | `OrderStatus` | 有效转换、显示名称 |

---

## 将值改为引用（Change Value to Reference）

当需要同一性语义时——对一个实例的修改应在所有使用该实例的地方可见——将值对象转换为引用对象。

### 动机

当你有多个同一客户的副本时，修改一个的电话号码不会影响其他的。如果业务规则要求共享同一个实例，使用注册表或仓库将值转换为引用。

### 操作步骤

1. 确定或创建一个该对象的工厂方法
2. 建立一个注册表（map、repository 或 lookup service）来存储实例
3. 修改工厂方法，在创建新实例之前先检查注册表
4. 修改客户端代码，使用工厂方法替代构造函数
5. 运行测试

### 示例

```javascript
// Registry pattern:
class CustomerRepository {
  constructor() {
    this._customers = new Map();
  }

  get(id) {
    if (!this._customers.has(id)) {
      this._customers.set(id, new Customer(id));
    }
    return this._customers.get(id);
  }
}

// All orders for customer #123 now share the same Customer object
const repo = new CustomerRepository();
const order1 = new Order(repo.get(123));
const order2 = new Order(repo.get(123));
// order1.customer === order2.customer  // true (same reference)
```

### 值 vs. 引用：决策指南

| 问题 | 值 | 引用 |
|----------|-------|-----------|
| 是否需要同一性（处处是同一个对象）？ | 否 | 是 |
| 对象是否不可变？ | 通常是 | 可能可变 |
| 是否按内容比较？ | 是（`equals()`） | 否（同一性 `===`） |
| 示例 | Money, DateRange, Color | Customer, Account, Product |

---

## 将数组替换为对象（Replace Array with Object）

将用作记录的数组（其中每个位置含义不同）替换为具有命名字段的对象。

### 动机

`row[0]` 是姓名，`row[1]` 是年龄，`row[2]` 是部门。这很脆弱、不可读且类型不安全。命名字段使结构具有自文档能力。

### 操作步骤

1. 创建一个类，为每个数组位置设置一个字段
2. 为每个字段添加 getter 和 setter
3. 将数组创建替换为对象构造
4. 将位置索引访问替换为命名访问
5. 运行测试

### 示例

**之前：**
```python
performance = ["Liverpool", 15, 2]
name = performance[0]
wins = performance[1]
losses = performance[2]
```

**之后：**
```python
class Performance:
    def __init__(self, name, wins, losses):
        self.name = name
        self.wins = wins
        self.losses = losses

performance = Performance("Liverpool", 15, 2)
name = performance.name
wins = performance.wins
losses = performance.losses
```

---

## 将魔法数字替换为符号常量（Replace Magic Number with Symbolic Constant）

将具有特定含义的字面量数字替换为命名常量。

### 动机

代码中的 `9.81` 毫无意义。`GRAVITATIONAL_ACCELERATION = 9.81` 传达了意图，防止了拼写错误（常量名由编译器检查），并将值集中以便于修改。

### 操作步骤

1. 声明一个常量，并将其设置为魔法数字
2. 找到该魔法数字的所有出现位置
3. 将每次出现替换为常量（检查每次出现是否代表相同的概念——数字 `100` 可能在一个地方表示"百分比"，在另一个地方表示"最大数量"）
4. 运行测试

### 常见的魔法数字分类

| 类别 | 之前 | 之后 |
|----------|--------|-------|
| 物理常量 | `9.81` | `GRAVITATIONAL_ACCELERATION` |
| 业务规则 | `0.08` | `SALES_TAX_RATE` |
| 限制 | `255` | `MAX_RGB_VALUE` |
| HTTP | `404` | `HTTP_NOT_FOUND` |
| 时间 | `86400` | `SECONDS_PER_DAY` |
| 重试 | `3` | `MAX_RETRY_ATTEMPTS` |
| 阈值 | `100` | `FREE_SHIPPING_THRESHOLD` |

### 何时不应替换

- 算术中的 `0` 和 `1` 通常可以直接使用字面量
- 循环计数器（`for i in range(10)`）在上下文中显而易见
- 数组索引 `[0]` 表示"第一个元素"是惯用写法

---

## 封装字段（Encapsulate Field）

将对公有字段的直接访问替换为 getter 和 setter 方法。

### 动机

公有字段让你无法控制读写操作。你无法在不改动每个调用者的前提下添加验证、日志记录、懒加载或计算值。封装为将来的更改创建了一个接缝。

### 操作步骤

1. 为该字段创建 getter 和 setter 方法
2. 找到所有对该字段的引用，将读取替换为 getter，写入替换为 setter
3. 将字段设为私有
4. 运行测试

### 示例

**之前：**
```python
class Person:
    def __init__(self, name):
        self.name = name  # public field

# Client:
person.name = "   Bob   "  # no validation, no trimming
```

**之后：**
```python
class Person:
    def __init__(self, name):
        self._name = None
        self.name = name  # uses the setter

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not value or not value.strip():
            raise ValueError("Name cannot be empty")
        self._name = value.strip()
```

---

## 封装集合（Encapsulate Collection）

不要从 getter 返回原始的可变集合。相反，返回一个不可修改的视图或副本，并提供显式的 add/remove 方法。

### 动机

当 getter 返回一个可变列表时，调用者可以在拥有对象不知情的情况下添加、删除或清空元素。这破坏了封装——对象无法强制执行不变量、触发事件或验证更改。

### 操作步骤

1. 在拥有类上添加 `addItem()` 和 `removeItem()` 方法
2. 将 getter 改为返回不可修改的视图（或副本）
3. 找到所有通过 getter 修改集合的调用者，将它们改为使用 add/remove 方法
4. 运行测试

### 示例

**之前：**
```javascript
class Course {}

class Person {
  get courses() { return this._courses; }
  set courses(list) { this._courses = list; }
}

// Client can mutate freely:
person.courses.push(newCourse);        // bypasses Person
person.courses.splice(0, 1);           // bypasses Person
person.courses = [];                   // replaces internal state
```

**之后：**
```javascript
class Person {
  get courses() {
    return [...this._courses]; // return a copy
  }

  addCourse(course) {
    this._courses.push(course);
  }

  removeCourse(course) {
    const index = this._courses.indexOf(course);
    if (index === -1) throw new RangeError('Course not found');
    this._courses.splice(index, 1);
  }

  get numberOfCourses() {
    return this._courses.length;
  }
}
```

### 特定语言的模式

| 语言 | 不可修改的返回 |
|----------|-------------------|
| Java | `Collections.unmodifiableList(list)` |
| JavaScript | `[...this._items]` 或 `Object.freeze([...this._items])` |
| Python | `tuple(self._items)` 或 `list(self._items)`（返回副本） |
| C# | `items.AsReadOnly()` |
| Go | 返回切片副本：`append([]T{}, items...)` |

---

## 将类型码替换为类（Replace Type Code with Class）

将不影响行为的类型码（整数或字符串常量）替换为适当的类。当类型码仅用于分类而不驱动条件逻辑时使用。

### 何时使用哪种方式

| 场景 | 重构手法 |
|-----------|-------------|
| 类型码仅为信息性（不改变行为） | 将类型码替换为类 |
| 类型码通过条件语句驱动行为 | 将类型码替换为子类 |
| 类型码可以在运行时改变 | 将类型码替换为策略/状态模式 |
| 类型码值很少且语言支持 | 使用枚举（Enum） |

### 将类型码替换为子类

当类型码通过条件语句决定行为时使用。

**之前：**
```javascript
class Employee {
  constructor(type) {
    this._type = type; // 'engineer', 'manager', 'salesperson'
  }

  calculatePay() {
    switch (this._type) {
      case 'engineer': return this.basePay;
      case 'manager': return this.basePay + this.bonus;
      case 'salesperson': return this.basePay + this.commission;
    }
  }

  canApproveExpenses() {
    return this._type === 'manager';
  }
}
```

**之后：**
```javascript
class Employee {
  calculatePay() { throw new Error('abstract'); }
  canApproveExpenses() { return false; }
}

class Engineer extends Employee {
  calculatePay() { return this.basePay; }
}

class Manager extends Employee {
  calculatePay() { return this.basePay + this.bonus; }
  canApproveExpenses() { return true; }
}

class Salesperson extends Employee {
  calculatePay() { return this.basePay + this.commission; }
}
```

### 将类型码替换为策略/状态模式

当类型码可以在运行时改变时使用（例如，员工可以从工程师晋升为经理），因此不能通过子类化员工本身来实现。

**之后（策略模式）：**
```javascript
class Employee {
  constructor(type) {
    this._type = type; // EmployeeType strategy object
  }

  calculatePay() {
    return this._type.calculatePay(this);
  }

  promoteToManager() {
    this._type = new ManagerType();
  }
}

class EngineerType {
  calculatePay(employee) { return employee.basePay; }
}

class ManagerType {
  calculatePay(employee) { return employee.basePay + employee.bonus; }
}
```

---

## 决策指南：使用哪种数据重构

| 场景 | 重构手法 |
|-----------|-------------|
| 原始值有关联的行为 | 将数据值替换为对象（Replace Data Value with Object） |
| 需要全系统共享一个实例 | 将值改为引用（Change Value to Reference） |
| 数组位置具有不同含义 | 将数组替换为对象（Replace Array with Object） |
| 字面量数字有领域含义 | 将魔法数字替换为符号常量（Replace Magic Number with Symbolic Constant） |
| 公有字段需要未来的灵活性 | 封装字段（Encapsulate Field） |
| Getter 返回可变集合 | 封装集合（Encapsulate Collection） |
| 类型码为信息性 | 将类型码替换为类/枚举（Replace Type Code with Class/Enum） |
| 类型码驱动行为 | 将类型码替换为子类（Replace Type Code with Subclasses） |
| 类型码在运行时变化 | 将类型码替换为策略模式（Replace Type Code with Strategy） |
