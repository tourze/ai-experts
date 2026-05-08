# 信息隐藏与信息泄露

信息隐藏是实现深层模块的最重要技术。它由 David Parnas 于 1971 年首次提出，至今仍是良好软件设计的基础。信息泄露是其反面——也是最常见的不必要复杂性来源之一。

## 信息隐藏原则

**每个模块应封装一些设计决策，其接口应尽可能少地揭示关于这些决策的信息。**

被隐藏的"信息"包括：
- 数据表示和存储格式
- 算法和实现策略
- 通信协议和传输格式
- 缓存策略和性能优化
- 错误处理细节和恢复机制
- 硬件和操作系统特定细节
- 并发和同步策略
- 配置和默认值

### 为什么信息隐藏能降低复杂性

1. **减少依赖：** 如果调用者不知道实现细节，它们就不能依赖它。对隐藏信息的更改只影响拥有该信息的模块。

2. **降低认知负荷：** 使用模块的开发者只需要理解其接口，而不是其内部实现。隐藏的信息是从他们的心智模型中移除的复杂性。

3. **消除未知的未知：** 当信息被适当隐藏时，没有调用者需要知道但被隐藏的内容。接口就是完整的契约。

4. **实现独立演化：** 隐藏的实现可以被更改、优化或替换，而不影响任何调用者。

## 信息泄露

**当设计决策在多个模块中被反映出来时，就发生了信息泄露。** 它创建了对该决策的依赖：如果决策改变，所有知道它的模块也必须改变。

### 信息泄露的形式

#### 1. 接口泄露（最明显）

模块的接口直接暴露实现细节。

```python
# Leaking: interface exposes file format details
class UserStore:
    def save_as_json(self, user, filepath):
        ...
    def load_from_json(self, filepath) -> User:
        ...

# Hiding: interface abstracts storage format
class UserStore:
    def save(self, user):
        ...
    def load(self, user_id) -> User:
        ...
```

在泄露版本中，每个调用者都知道存储格式是 JSON。切换到数据库需要更改每个调用者。在隐藏版本中，存储机制是内部决策。

#### 2. 后门泄露（最微妙）

两个模块共享既不属于任何一个接口的知识，通常通过共享数据格式、文件约定或隐式协议。

```python
# Module A writes:
with open("data.csv") as f:
    f.write(f"{user.id},{user.name},{user.email}\n")

# Module B reads (far away in the codebase):
with open("data.csv") as f:
    for line in f:
        id, name, email = line.strip().split(",")
```

两个模块都知道 CSV 格式（逗号分隔，字段顺序：id、name、email）。这种知识不在任何一个模块的接口中。如果格式改变，两者都必须改变，但没有编译器错误或类型检查来指导你。这是一个经典的未知未知。

**修复：** 创建一个拥有数据格式的单一模块：

```python
class UserCsvStore:
    def write(self, user):
        ...
    def read_all(self) -> list[User]:
        ...
```

#### 3. 时序泄露

代码根据事情发生的时间而不是它们共享的知识进行拆分。

```python
# Temporal decomposition: split by time
class HttpRequestReader:
    def read_headers(self, socket) -> dict:
        # Knows HTTP header format
        ...

class HttpRequestParser:
    def parse_body(self, headers, socket) -> Body:
        # Also knows HTTP header format (Content-Length, Content-Type)
        ...

class HttpResponseWriter:
    def write_response(self, socket, status, headers, body):
        # Also knows HTTP format
        ...
```

所有三个模块都知道 HTTP 格式，即使它们被拆分为"读取"、"解析"和"写入"阶段。时序分解迫使共享知识跨越模块边界。

**修复：** 按知识组织，而不是按时间：

```python
class HttpConnection:
    def receive_request(self, socket) -> HttpRequest:
        # All HTTP format knowledge lives here
        ...
    def send_response(self, socket, response: HttpResponse):
        # All HTTP format knowledge lives here
        ...
```

#### 4. 装饰器泄露

装饰器模式是泄露的常见来源，因为装饰器必须理解它所包装对象的完整接口。

```java
// The decorator knows everything about InputStream's interface
class LoggingInputStream extends InputStream {
    private InputStream wrapped;

    public int read() {
        log("reading one byte");
        return wrapped.read();  // Pass-through
    }

    public int read(byte[] b) {
        log("reading into buffer");
        return wrapped.read(b);  // Pass-through
    }

    public int read(byte[] b, int off, int len) {
        log("reading with offset");
        return wrapped.read(b, off, len);  // Pass-through
    }

    // Must implement every InputStream method...
}
```

装饰器是浅层的：它增加了最小的功能（日志），但必须复制整个接口。对 `InputStream` 的每次更改都会传播到每个装饰器。

**更好的替代方案：**
- 在原始类内部添加日志（通过标志控制）
- 使用不需要接口复制的面向方面的方案
- 在深层模块内部添加钩子/回调机制

### 如何检测信息泄露

| 信号 | 它意味着什么 |
|--------|--------------|
| "总是一起更改"的两个模块 | 它们共享应放在一处的知识 |
| 在多个文件中提及的数据格式或协议 | 格式知识已经泄露 |
| 内部实现更改时失败的测试 | 测试代码泄露了关于内部的知识 |
| "必须与模块 X 中的格式匹配"之类的注释 | 对泄露的明确承认 |
| 跨模块共享的全局常量 | 可能表明耦合的共享知识 |
| 多个模块中类似的解析/格式化代码 | 格式知识被重复 |

## 减少信息泄露

### 策略 1：合并共享知识的模块

如果两个模块共享关于设计决策的知识，考虑合并它们。结果是一个封装了该决策的模块，为系统其余部分提供单一接口。

**之前：**
```python
class ConfigReader:
    def read(self, path) -> dict:
        # Knows config file format
        ...

class ConfigApplier:
    def apply(self, config: dict):
        # Also knows config structure
        ...
```

**之后：**
```python
class ConfigManager:
    def load_and_apply(self, path):
        # All config knowledge in one place
        ...
```

### 策略 2：为共享知识创建一个新模块

如果合并不切实际（这些模块是真正不同的关注点），将共享知识提取到两者都依赖的新模块中。

**之前：**
```python
# In api_handler.py:
def format_error(code, message):
    return {"error": {"code": code, "message": message, "timestamp": now()}}

# In webhook_handler.py:
def format_error(code, message):
    return {"error": {"code": code, "message": message, "timestamp": now()}}
```

**之后：**
```python
# In error_format.py:
def format_error(code, message):
    return {"error": {"code": code, "message": message, "timestamp": now()}}

# Both api_handler and webhook_handler import from error_format
```

### 策略 3：将知识向下推

将知识从调用者移到它们调用的模块中。这深化了模块并简化了其接口。

**之前：**
```python
# Caller must know about retry strategy
for attempt in range(3):
    try:
        result = api_client.call(endpoint, data)
        break
    except TransientError:
        time.sleep(2 ** attempt)
```

**之后：**
```python
# Module handles retries internally
result = api_client.call(endpoint, data)
# Retries, backoff, and error classification are hidden inside api_client
```

### 策略 4：通过物理方式分离接口与实现

使用语言机制来强制执行信息隐藏：

| 语言 | 机制 | 效果 |
|----------|----------|--------|
| Python | 下划线前缀（`_private_method`） | 基于约定的隐藏 |
| Java/C# | `private`/`protected` 关键字 | 编译器强制隐藏 |
| Go | 小写名称（未导出） | 包级隐藏 |
| Rust | `pub` vs 非 `pub` | 模块级隐藏 |
| TypeScript | `private`、`#field`、模块作用域 | 多级隐藏 |

### 策略 5：围绕抽象设计接口

接口应在抽象层面描述模块**做什么**，而不是描述模块**怎么做**。

```python
# Leaking (how):
class Cache:
    def get_from_lru(self, key): ...
    def put_with_ttl(self, key, value, ttl_seconds): ...
    def evict_lru_entries(self, count): ...

# Hiding (what):
class Cache:
    def get(self, key): ...
    def put(self, key, value): ...
    # LRU policy, TTL, eviction are internal decisions
```

## 案例研究：HTTP 请求处理

Web 服务器必须读取 HTTP 请求（头部和主体），将其路由到处理器，处理它，并发送响应。以下是时序分解如何导致泄露，以及基于信息的分解如何避免它。

### 时序分解（有问题的）

```
Phase 1: Read raw bytes from socket → knows HTTP header format
Phase 2: Parse headers → knows HTTP header format
Phase 3: Read body based on Content-Length → knows header meaning
Phase 4: Route to handler → knows URL format from headers
Phase 5: Build response → knows HTTP response format
Phase 6: Write response to socket → knows HTTP format
```

HTTP 格式知识散布在 6 个阶段中。更改 HTTP 处理的任何内容都需要接触所有阶段。

### 基于信息的分解（更好的）

```
HttpProtocol module:
  - Owns ALL knowledge of HTTP format (headers, body, status codes)
  - Reads socket → produces HttpRequest objects
  - Takes HttpResponse objects → writes to socket

Router module:
  - Owns URL pattern matching
  - Maps HttpRequest to handler function

Handler modules:
  - Work with high-level HttpRequest/HttpResponse objects
  - Know nothing about raw HTTP format
```

现在 HTTP 格式知识存在于一个地方。路由器只知道 URL 模式。处理器只知道请求/响应对象。每个模块隐藏其特定知识。

## 信息隐藏检查清单

对系统中的每个模块，问：

| 问题 | 期望的答案 |
|----------|---------------|
| 该模块隐藏了什么设计决策？ | 至少一个重要的决策 |
| 能否在不更改调用者的情况下替换实现？ | 是的 |
| 接口是否提及了实现特定的概念？ | 否 |
| 测试验证的是行为还是实现？ | 行为 |
| 是否还有其他模块共享关于同一实现细节的知识？ | 否 |
| 如果此模块的内部格式更改，有多少其他模块必须更改？ | 零 |

如果任何答案不令人满意，信息正在泄露，应重新考虑设计。

## 与其他原则的关系

- **深层模块**主要通过信息隐藏来实现深度——隐藏的信息是使它们深层的因素
- **通用接口**隐藏特定用例，这是信息隐藏的一种形式
- **注释**应描述接口（可见的内容），而不揭示隐藏的实现细节
- **战略式编程**是一种心态，使开发者愿意投入精力进行适当的信息隐藏，而不是采取导致泄露的捷径
