# 深层模块 vs. 浅层模块

模块深度的概念是 Ousterhout 哲学中最强大的思想之一。它提供了一种具体的方式来评估一个模块是否在系统中承担了其应有的重量。

## 核心思想

每个模块都有两个部分：
- **接口：** 它施加给系统其余部分的复杂性（成本）
- **实现：** 它提供的功能（收益）

模块的价值由提供的功能与施加的接口复杂性的比率决定。

```
Module Value = Functionality / Interface Complexity
```

**深层模块**具有高价值：它们通过简单的接口提供大量的功能。**浅层模块**具有低价值：它们的接口几乎和它们的实现一样复杂，因此为系统增加的净简化很少。

## 可视化模块深度

把模块想象成一个矩形：
- 顶部宽度 = 接口复杂性
- 高度 = 实现深度（隐藏的功能）

```
Deep Module:               Shallow Module:
┌──────┐                   ┌──────────────────────┐
│      │                   │                      │
│      │                   └──────────────────────┘
│      │
│      │
│      │
│      │
└──────┘
Narrow interface,          Wide interface,
deep implementation.       shallow implementation.
```

目标是高而窄的矩形：通过小接口隐藏大量复杂性的模块。

## 深层模块示例

### Unix 文件 I/O

Unix 文件 I/O 接口是计算领域最深入的抽象之一：

```c
int open(const char *path, int flags);
int close(int fd);
ssize_t read(int fd, void *buf, size_t count);
ssize_t write(int fd, const void *buf, size_t count);
off_t lseek(int fd, off_t offset, int whence);
```

五个函数。在这个简单接口背后，实现处理了：
- 磁盘块分配和管理
- 目录遍历和路径解析
- 文件权限和访问控制
- 缓冲区缓存和写回策略
- 设备驱动通信
- 文件系统日志和崩溃恢复
- 网络文件系统协议（NFS）
- 内存映射文件协调
- 并发访问和锁定

接口用几个函数衡量；实现是数十万行代码。这是极端的深度。

### 垃圾回收器

垃圾回收器的接口基本上是隐形的：

```
Interface: (none -- just allocate objects normally)
```

在这个零复杂性的接口背后，实现处理了：
- 引用跟踪和可达性分析
- 分代收集策略
- 压缩和内存碎片整理
- 不停止世界的并发收集
- 弱引用和终结操作
- 堆大小调整和增长启发式

最深入的模块是其接口如此简单，以至于调用者甚至可能没有意识到它们的存在。

### TCP/IP 网络

```python
socket.send(data)
socket.recv(buffer_size)
```

这背后：
- 数据包分段和重组
- 重传和确认
- 流量控制和拥塞避免
- 跨网络路由
- 校验验证
- 连接状态管理
- 乱序数据包处理

### 哈希映射

```python
map[key] = value
value = map[key]
del map[key]
```

这背后：
- 散列函数计算
- 冲突解决（链地址法、开放寻址法）
- 动态调整大小和重新散列
- 内存分配策略
- 负载因子管理
- 迭代器失效处理

## 浅层模块示例

### Java I/O 类（经典示例）

要在 Java 中从文件读取反序列化对象：

```java
FileInputStream fileStream = new FileInputStream(filename);
BufferedInputStream bufferedStream = new BufferedInputStream(fileStream);
ObjectInputStream objectStream = new ObjectInputStream(bufferedStream);
```

三个类，每个添加了一个薄层：
- `FileInputStream`：从文件读取字节（无缓冲）
- `BufferedInputStream`：添加缓冲（为什么这不是默认的？）
- `ObjectInputStream`：反序列化对象

每个类都是浅层的：其接口几乎和实现一样复杂。三个接口的总认知负荷大于单个深层接口所施加的认知负荷。深层设计应该是：

```java
ObjectInputStream stream = new ObjectInputStream(filename);
// Handles file opening, buffering, and deserialization internally
```

### 薄包装类

```python
class UserValidator:
    def validate(self, user):
        if not user.name:
            raise ValueError("Name required")
        if not user.email:
            raise ValueError("Email required")

class UserSaver:
    def save(self, user):
        self.db.insert(user)

class UserService:
    def create_user(self, data):
        user = User(data)
        self.validator.validate(user)
        self.saver.save(user)
```

三个类，而一个类就足够了：

```python
class UserService:
    def create_user(self, data):
        user = User(data)
        if not user.name:
            raise ValueError("Name required")
        if not user.email:
            raise ValueError("Email required")
        self.db.insert(user)
```

三个类的版本创建了两个额外的接口（以及它们的测试、文件和导入链）而没有提供有意义的抽象。验证和持久化逻辑太简单了，不值得单独的模块。

### 透传方法

```python
class OrderController:
    def create_order(self, request):
        order_data = self.parse_request(request)
        return self.order_service.create_order(order_data)

class OrderService:
    def create_order(self, order_data):
        validated = self.validate(order_data)
        return self.order_repository.create_order(validated)

class OrderRepository:
    def create_order(self, order_data):
        return self.db.insert("orders", order_data)
```

每一层几乎没有增加任何东西。`create_order` 方法出现了三次，每次只是将数据传递给下一层。这是浅层分解的标志。

## 类的疾病（Classitis）

**类的疾病** 是"类应该很小"这一错误信念在不加判断地应用时产生的问题。它产生了有数百个微小类的系统，每个类做很少的事情，由接口的网状结构连接。

### 类的疾病的症状

| 症状 | 示例 |
|---------|---------|
| 许多类每类只有 10-30 行 | `StringHelper`、`DateFormatter`、`NullChecker` |
| 大多数方法是一行代码或委托 | `getName() { return this.name; }` |
| 理解一个功能需要阅读 8 个以上类 | Controller、Service、Repository、Mapper、Validator、DTO、Entity、Factory |
| 类名以 -Helper、-Util、-Manager、-Handler 结尾 | `UserManager`、`OrderHandler`、`DataHelper` |
| 大多数类只有 1-2 个方法 | 一个只有 `validate()` 的 `Validator` 类 |

### 类的疾病为何发生

1. **误解的"单一职责原则"**：SRP 是说"一个变更理由"，而不是"做一件事"。一个模块可以做很多事情，只要它们都一起变更。
2. **盲目跟风设计模式**：不评估是否增加了深度就反射性地应用模式（Strategy、Factory、Builder）。
3. **指标迷信**：为"小类大小"或"每类方法少"而优化，而非深度。
4. **测试驱动的粒度**：仅仅为了使类可独立测试而创建类，即使它们没有独立的意义。

### 治疗方法

对每个类问：**"这个类在其接口背后隐藏了显著的复杂性吗？"**

如果答案是否定的，它就是与另一个类合并的候选。更少、更深的类几乎总是比许多浅层类产生更简单的系统。

## 何时浅层是可以接受的

并非每个模块都需要深度。浅层模块在以下情况下是可以接受的：

| 场景 | 为什么可以 | 示例 |
|-----------|------------|---------|
| **分发器** | 路由逻辑本质上是浅层的 | 将路径映射到处理器的 URL 路由器 |
| **接口适配器** | 在两个深层模块之间进行转换 | 内部和外部数据格式之间的转换 |
| **语言/框架要求** | 框架要求使用该类 | Java servlet、Python ABC 实现 |
| **真正的一行工具** | 抽象本身就是名称 | `isEven(n)`、`clamp(value, min, max)` |
| **入口点** | 连接模块的顶层接线 | `main()` 函数、依赖注入配置 |

关键是这些浅层模块应该是**罕见的例外**，而不是常态。如果你的大部分模块都是浅层的，设计需要重新思考。

## 为深度而设计

### 策略 1：组合相关功能

替换：
```
RequestParser + RequestValidator + RequestAuthorizer + RequestHandler + ResponseBuilder
```

考虑：
```
RequestHandler (parses, validates, authorizes, handles, and builds response)
```

如果这些操作总是同时发生并且共享关于请求格式的知识，将它们组合成一个深层模块可以消除四个接口并产生更简单的系统。

### 策略 2：隐藏实现决策

问："这个模块做了哪些其他模块不需要知道的决策？"

每个隐藏的决策都增加了深度。好的例子：
- 缓冲区大小和缓存策略
- 重试逻辑和退避策略
- 连接池和生命周期管理
- 数据格式和序列化细节
- 并发和锁定策略

### 策略 3：提供默认值

不要求调用者指定所有内容：

```python
# Shallow: caller must know about all options
def connect(host, port, timeout, retry_count, retry_delay,
            ssl_cert, ssl_key, keepalive, buffer_size):

# Deep: sensible defaults hide decisions
def connect(host, port=5432, **options):
    # Internally determines timeout, retries, SSL, etc.
```

### 策略 4：吸收复杂性

当存在两种方式时——一种对模块更简单但将复杂性推给调用者，一种实现起来更难但对调用者更简单——选择让调用者生活更轻松的方式。

```python
# Pushes complexity to caller:
entries = log.read_raw()  # Returns raw bytes; caller must parse
parsed = parse_log_format(entries)  # Caller needs format knowledge

# Absorbs complexity:
entries = log.read()  # Returns parsed, structured entries
```

### 策略 5：质疑每个接口元素

对接口中的每个方法、参数或返回值，问：
- "调用者真的需要这个吗？"
- "模块内部能决定这个吗？"
- "有没有更简单的方式来表达这个？"

移除任何不能证明其存在合理性的东西。接口中的每个元素都是有成本的，必须由它启用的功能来证明。

## 在实践中度量深度

### 快速评估

| 问题 | 深层 | 浅层 |
|----------|------|---------|
| 接口中有多少方法？ | 少（3-7） | 多（15+） |
| 每个方法有多少参数？ | 少（1-3） | 多（5+） |
| 实现有多长？ | 显著大于接口 | 大约和接口一样 |
| 你能用一句话描述该模块吗？ | 是的 | 需要一段话 |
| 该模块是否隐藏了一个非平凡的决策？ | 是的，多个 | 不完全是 |
| 移除它是否会要求调用者复制代码？ | 大量重复 | 最小重复 |

### 深度比率

一个粗略的启发式方法：比较接口文档的行数与实现代码的行数。如果它们接近相等，模块很可能是浅层的。如果实现比接口描述大 5-10 倍，模块很可能是深层的。

这本身不是关于代码行数——而是相对于暴露接口的隐藏复杂性的量。一个像 `gc.collect()` 这样的一行接口隐藏了数千行垃圾回收逻辑，是极度深层的。

## 常见异议

### "但是小类更容易测试！"

小类在隔离中进行**单元测试**更容易，但系统的**集成测试**更困难，因为你有更多的接口需要模拟、更多的交互需要验证、更多的接线需要正确。拥有更多行为的深层模块通常更容易在重要的层面上测试："这个功能是否工作？"

### "但是单一职责原则说……"

SRP 说一个模块应该只有"一个变更理由"，这是关于**内聚性**的，而不是关于大小的。一个处理文件 I/O 所有方面（打开、读取、写入、缓冲、关闭）的模块只因为一个原因而变化：当文件 I/O 需求发生变化时。这是一个深度实现的单一职责。

### "但是关注点分离呢？"

关注点分离是关于将不相关的事物分开，而不是将相关的事物分割成微小碎片。如果解析、验证和处理请求都是关于"请求处理"的，它们可以存在于一个模块中。分离真正独立的关注点（例如日志和业务逻辑），而不是单个工作流的每一步。
