# 在对象之间搬移特性

在类之间重新分配职责的重构详解。面向对象设计的根本问题是：这个行为应该放在哪里？这些重构提供了将行为移动到正确位置的操作步骤。

---

## 搬移方法（Move Method）

将方法移动到它使用最多的类中。如果一个方法访问另一个类的特性比访问自身更多，则存在依恋情结（Feature Envy），应当归属于其他地方。

### 动机

搬移方法最常见的原因是依恋情结——当一个方法大部分时间都在与另一个对象交互时。搬移方法可以降低耦合：方法现在位于数据所在的地方，因此对这些数据的修改不会向外波及。

### 操作步骤

1. 检查该方法使用的所有特性（字段和方法）。确定该方法使用了哪个类最多的特性。
2. 检查源类中相关的方法。如果其他方法也使用了同一个目标类，考虑一起搬移。
3. 检查父类和子类是否存在覆盖或相关声明。
4. 在目标类中声明该方法。复制方法体并调整引用——`this` 现在指向目标；源对象可能需要作为参数传递。
5. 将源方法转变为委托方法（调用目标方法）。
6. 运行测试。
7. 如果没有其他调用者需要该委托方法，考虑将其移除。
8. 运行测试。

### 示例

**之前：**
```javascript
class Account {
  overdraftCharge() {
    if (this.type.isPremium()) {
      let result = 10;
      if (this.daysOverdrawn > 7) {
        result += (this.daysOverdrawn - 7) * 0.85;
      }
      return result;
    } else {
      return this.daysOverdrawn * 1.75;
    }
  }
}
```

该方法严重依赖 `this.type`（一个 `AccountType` 对象）。将其搬移到那里。

**之后：**
```javascript
class AccountType {
  overdraftCharge(daysOverdrawn) {
    if (this.isPremium()) {
      let result = 10;
      if (daysOverdrawn > 7) {
        result += (daysOverdrawn - 7) * 0.85;
      }
      return result;
    } else {
      return daysOverdrawn * 1.75;
    }
  }
}

class Account {
  overdraftCharge() {
    return this.type.overdraftCharge(this.daysOverdrawn);
  }
}
```

### 决策标准

以下情况应搬移方法：
- 它使用了另一个类的字段/方法多于自己的
- 目标类可能以影响此方法的方式发生变化
- 相关方法已经存在于目标类中

以下情况不应搬移：
- 该方法同等地使用来自多个类的特性（将其保持在最稳定的位置）
- 需要在源类上使用多态性

---

## 搬移字段（Move Field）

将字段移动到使用它更多的类中。类似于搬移方法，但针对数据。

### 动机

一个字段被另一个类使用得更多，表明数据模型与行为模型不一致。搬移字段使数据和行为保持在一起。

### 操作步骤

1. 如果字段是公有的，先封装它（封装字段）
2. 在目标类中创建该字段，并附带 getter 和 setter
3. 确定如何从源类引用目标类（通常是已有的关联关系）
4. 更新源类的 getter 以委托给目标类
5. 运行测试
6. 从源类中移除该字段
7. 运行测试

### 示例

**之前：**
```python
class Customer:
    def __init__(self):
        self.discount_rate = 0.0

class Order:
    def discounted_total(self):
        return self.base_total() - (self.base_total() * self.customer.discount_rate)
```

`discount_rate` 仅被 `Order` 通过 `Customer` 读取。如果涉及 `discount_rate` 的大多数逻辑都存在于客户的定价上下文中，则保留在 `Customer` 中。但如果 `Order` 是主要消费者，且 `discount_rate` 实际上与订单定价策略相关，考虑搬移它。

---

## 提炼类（Extract Class）

将一个承担两件事的类拆分为两个各做一件事的类。

### 动机

职责过多的类会变得过于臃肿，难以理解。如果你能识别出一组相互之间比与类的其他部分关系更密切的字段和方法子集，那么该子集就值得拥有自己的类。

### 操作步骤

1. 识别要拆分出去的职责子集
2. 创建一个以拆分出去职责命名的新类
3. 从旧类到新类添加一个链接
4. 对子集中的每个字段使用搬移字段
5. 对子集中的每个方法使用搬移方法
6. 审查两个类的接口。删除不需要的方法，视情况进行重命名。
7. 决定公开新类还是将其隐藏在原始类后面
8. 运行测试

### 示例

**之前：**
```javascript
class Person {
  constructor() {
    this.name = '';
    this.officeAreaCode = '';
    this.officeNumber = '';
  }

  get telephoneNumber() {
    return `(${this.officeAreaCode}) ${this.officeNumber}`;
  }
}
```

**之后：**
```javascript
class TelephoneNumber {
  constructor() {
    this.areaCode = '';
    this.number = '';
  }

  toString() {
    return `(${this.areaCode}) ${this.number}`;
  }
}

class Person {
  constructor() {
    this.name = '';
    this.telephoneNumber = new TelephoneNumber();
  }

  get telephone() {
    return this.telephoneNumber.toString();
  }
}
```

### 提示需要提炼的信号

| 信号 | 需提炼的内容 |
|--------|----------------|
| 字段名前缀分组（例如 `shippingStreet`、`shippingCity`） | `ShippingAddress` 类 |
| 方法只使用字段子集 | 字段子集 + 其方法 = 新类 |
| 子集以不同速率变化 | 变化较快的子集值得拥有自己的类 |
| 子集有不同的协作者 | 每个协作者关系 = 潜在的类边界 |

---

## 内联类（Inline Class）

提炼类的逆操作。将一个不再承担足够职责的类合并回另一个类中。

### 动机

一个做得太少的类——也许经过之前的重构将其职责移到了别处——增加了复杂性却没有带来价值。将其合并回使用它的类中。

### 操作步骤

1. 对源类的每个公有方法和字段，在目标类中创建对应的成员
2. 将所有对源类的引用改为使用目标类
3. 运行测试
4. 删除源类
5. 运行测试

### 使用时机

- 该类只有一两个琐碎方法
- 该类由提炼类创建，但后续重构使其内容变空
- 该类只增加了间接层，本身没有任何逻辑、验证或行为

---

## 隐藏委托关系（Hide Delegate）

封装一个对象委托给另一个对象的事实。在服务端创建一个方法，对客户端隐藏委托对象，贯彻迪米特法则（Law of Demeter）。

### 动机

当客户端调用 `person.getDepartment().getManager()` 时，客户端知道了 `Department` 类——它耦合到了导航结构。如果 `Department` 修改了接口，客户端就会出错。通过添加 `person.getManager()`（内部调用 `department.getManager()`），客户端只知道 `Person`。

### 操作步骤

1. 对客户端在委托对象上调用的每个方法，在服务端创建一个简单的委托方法
2. 将客户端改为调用服务端方法
3. 如果没有客户端再需要委托对象的访问器，将其移除
4. 运行测试

### 示例

**之前：**
```python
# Client code:
manager = person.department.manager
```

**之后：**
```python
class Person:
    @property
    def manager(self):
        return self.department.manager

# Client code:
manager = person.manager
```

### 权衡

隐藏每个委托会导致中间人（Middle Man）坏味道——一个除了转发调用外什么都不做的类。正确的平衡：

| 场景 | 操作 |
|-----------|--------|
| 委托的接口不稳定 | 隐藏（保护调用者免受变化影响） |
| 客户端使用多个委托方法 | 考虑对每个方法进行隐藏委托 |
| 服务端变成了纯粹的转发 | 移除中间人 |
| 调用链很深（a.b.c.d） | 必须隐藏 |

---

## 移除中间人（Remove Middle Man）

隐藏委托关系的逆操作。当一个类主要由委托给另一个类的方法组成时，让客户端直接调用委托对象。

### 动机

随着系统演化，越来越多的委托方法不断累积，直到"服务端"类不再增加价值——它只是一个透传。此时，移除间接层。

### 操作步骤

1. 在服务端为委托对象创建一个 getter（如果不存在）
2. 对每个不增加价值的委托方法，将客户端重定向为直接调用委托对象
3. 从服务端移除该委托方法
4. 运行测试

### 示例

**之前：**
```javascript
class Person {
  get manager() { return this.department.manager; }
  get budget() { return this.department.budget; }
  get headcount() { return this.department.headcount; }
  get location() { return this.department.location; }
  // ... 10 more forwarding methods
}
```

**之后：**
```javascript
class Person {
  get department() { return this._department; }
}

// Client:
const manager = person.department.manager;
```

---

## 引入外加函数（Introduce Foreign Method）

当服务端类需要一个额外的方法但你无法修改它（第三方库、冻结的模块）时，在客户端类中创建该方法，并将服务端对象作为第一个参数传入。

### 动机

一个"本应"存在于服务端类中但无法添加的实用方法。外加函数是一种变通方案——标记它，以便将来服务端类开放修改时可以将该方法迁移过去。

### 示例

```python
# Server class (third-party, can't modify):
# date = Date(year, month, day)

# Foreign method in client:
def next_day(date):
    """Foreign method -- should be on Date class."""
    return Date(date.year, date.month, date.day + 1)
```

---

## 引入本地扩展（Introduce Local Extension）

当需要在无法修改的服务端类上添加多个外加函数时，创建一个新类——可以是子类或包装器——来添加缺失的方法。

### 子类 vs. 包装器

| 方式 | 使用时机 |
|----------|-------------|
| 子类（Subclass） | 当你可以继承服务端类时；最简单的方式 |
| 包装器（Wrapper/Decorator） | 当你无法继承时（final 类）；转发所有原始方法 |

### 示例（包装器）

```javascript
class EnhancedDate {
  constructor(date) {
    this._original = date;
  }

  // Forward original methods
  getYear() { return this._original.getYear(); }
  getMonth() { return this._original.getMonth(); }

  // New methods
  nextDay() {
    return new EnhancedDate(
      new Date(this._original.getTime() + 86400000)
    );
  }

  isWeekend() {
    const day = this._original.getDay();
    return day === 0 || day === 6;
  }
}
```

---

## 决策指南：这个行为属于哪里？

使用这些问题来决定是否以及在哪里搬移代码：

| 问题 | 如果是 | 操作 |
|----------|--------|--------|
| 此方法是否使用了另一个类更多的特性？ | 依恋情结 | 搬移方法到该类 |
| 此字段是否被另一个类用得更多？ | 数据放置不当 | 搬移字段到该类 |
| 此类是否有两组互不交互的字段？ | 多重职责 | 提炼类 |
| 此类是否只是一个没有逻辑的薄包装？ | 不必要的间接层 | 内联类 |
| 客户端是否通过对象链导航？ | 紧耦合 | 隐藏委托关系 |
| 此类是否只是转发调用？ | 中间人坏味道 | 移除中间人 |
| 需要给无法修改的类添加方法？ | 缺失功能 | 引入外加函数或本地扩展 |

### 职责放置启发法

当不确定将方法放在哪里时，问：**"如果此方法使用的数据发生变化，哪个类需要被更新？"** 该方法应属于那个类。这使数据和行为保持在一起，最大限度地减少变化的涟漪效应。
