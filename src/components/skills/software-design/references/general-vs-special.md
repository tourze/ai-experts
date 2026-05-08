# 通用 vs. 专用模块

最重要的设计决策之一是模块的接口应该是通用的还是专用的。Ousterhout 主张采用"一定程度通用"的方法：足够通用以避免特例，足够具体以避免过度工程。

## 谱系

```
太专用 ←————————————————————————→ 太通用
  （臃肿     （最佳点：                  （浪费精力、
   充满        "一定程度               不必要的
   特例        通用"）                   抽象）
   案例）
```

### 太专用

为特定用例设计的模块。其接口包含将其绑定到特定调用者或场景的细节。

```python
# Too special: designed for one specific email use case
class WelcomeEmailSender:
    def send_welcome_email(self, user_name, user_email, plan_name):
        ...

class PasswordResetEmailSender:
    def send_reset_email(self, user_email, reset_token, expiry_minutes):
        ...

class InvoiceEmailSender:
    def send_invoice_email(self, user_email, invoice_id, amount, due_date):
        ...
```

三个类做本质上相同的事情（发送邮件），接口绑定到特定用例。添加第四种邮件类型需要创建另一个类。

### 太通用

为每个可能的用例而设计的模块，包括可能永远不会出现的用例。

```python
# Too general: anticipates every possible need
class UniversalMessageDispatcher:
    def dispatch(self, channel, template, recipients, variables,
                 priority, scheduling, retry_policy, attachments,
                 tracking_config, ab_test_config, localization_config,
                 rate_limiting_config, webhook_callbacks):
        ...
```

接口如此通用，使用它需理解 13 个参数。大多数调用者只会使用其中的一小部分。

### 一定程度通用（最佳点）

```python
# Somewhat general: covers current needs with a simple interface
class EmailService:
    def send(self, to: str, subject: str, body: str,
             attachments: list = None):
        ...
```

这涵盖了欢迎邮件、密码重置、发票以及任何未来邮件类型，使用单个简单接口。它足够通用以处理所有当前用例而不需要特例方法，但它不试图处理 SMS、推送通知或 A/B 测试。

## 关键问题

> **"满足我所有当前需求的最简单接口是什么？"**

这个问题是找到最佳点的实用工具。它有三个重要的部分：

1. **最简单的接口：** 最小化方法、参数和概念的数量
2. **所有当前需求：** 不为假设的未来需求设计
3. **覆盖：** 接口必须实际适用于每个当前用例，而不需要变通方案

### 应用该问题

**第 1 步：** 列出模块的所有当前用例。

**第 2 步：** 对每个用例，确定调用者需要从模块获得什么。

**第 3 步：** 找到满足所有调用者的最小方法集和参数集。

**第 4 步：** 检查没有用例需要笨拙的变通方案。

**示例：**

一个文本编辑器需要支持：
- 在某个位置插入文本
- 删除一段范围的文本
- 替换一段范围的文本

专用方法：
```python
class TextEditor:
    def insert_text(self, position, text): ...
    def delete_range(self, start, end): ...
    def replace_range(self, start, end, new_text): ...
    def insert_heading(self, position, level, text): ...
    def insert_bullet_point(self, position, text): ...
    def delete_word(self, position): ...
    def replace_word(self, position, new_word): ...
```

一定程度通用的方法：
```python
class TextEditor:
    def insert(self, position, text): ...
    def delete(self, start, end): ...
```

通用的方法用两个方法覆盖了所有情况。`replace` 就是 `delete` 后跟 `insert`。标题和要点只是带有格式字符的文本。接口更简单，覆盖了所有当前需求。

## 将复杂性向下推

**原则：** 让模块有简单的接口比简单的实现更重要。

当系统中必须存在复杂性时，最好将其放在模块内部（深化它），而不是放在模块的接口中（给所有调用者增加负担）。

### 为什么向下而不是向上？

| 复杂性位置 | 谁承担成本 | 乘数效应 |
|--------------------|-------------------|-------------------|
| 模块内部 | 模块的开发者，一次 | 1x |
| 在接口中 | 每个调用者，每次使用 | Nx（N = 调用者数量） |

一个具有复杂实现但简单接口的模块只对一位开发者（模块作者）施加了复杂性。一个具有简单实现但复杂接口的模块对每个使用它的开发者都施加了复杂性。

### 示例：连接池

**复杂性向上推（给调用者）：**
```python
# Every caller must manage pool lifecycle
pool = ConnectionPool(host, port, min_size=5, max_size=20)
conn = pool.acquire(timeout=5)
try:
    result = conn.execute(query)
finally:
    pool.release(conn)
# Must also handle pool exhaustion, stale connections, reconnection...
```

**复杂性向下推（进入模块）：**
```python
# Caller just makes queries; pooling is internal
db = Database(connection_string)
result = db.query(sql, params)
# Pool management, connection lifecycle, retries all handled internally
```

### 示例：错误处理

**复杂性向上推：**
```python
result = parser.parse(input)
if result.has_syntax_error:
    handle_syntax_error(result.syntax_error)
elif result.has_semantic_error:
    handle_semantic_error(result.semantic_error)
elif result.has_ambiguity:
    handle_ambiguity(result.ambiguity)
else:
    process(result.value)
```

**复杂性向下推：**
```python
try:
    result = parser.parse(input)
    process(result)
except ParseError as e:
    # Module classifies and wraps all error types with clear messages
    show_error(e.message, e.location)
```

## 配置参数：复杂性放大器

配置参数是模块将复杂性向上推给调用者的最常见方式之一。每个参数代表模块拒绝做出的一个决策。

### 问题

```python
# 11 decisions pushed to the caller
cache = Cache(
    max_size=1000,
    eviction_policy="lru",
    ttl_seconds=3600,
    cleanup_interval=300,
    max_memory_mb=256,
    serializer="json",
    compression=True,
    compression_level=6,
    stats_enabled=True,
    stats_interval=60,
    thread_safe=True,
)
```

每个参数都是调用者必须回答的一个问题。大多数调用者不知道正确答案，会从示例复制值或猜测。错误的值会导致难以诊断的细微性能问题或 bug。

### 更好的方法

| 策略 | 如何帮助 | 示例 |
|----------|-------------|---------|
| **合理的默认值** | 模块做出决策，除非被覆盖 | `Cache()` 以合理的默认值工作；只覆盖你需要的 |
| **自动检测** | 模块在运行时确定正确的值 | 根据可用内存自动调整大小；根据数据特征自动选择压缩 |
| **渐进式披露** | 简单用途用简单 API；高级用途用选项 | `Cache()` 用于基本使用；`Cache.builder().with_eviction(lru).build()` 用于自定义 |
| **约定优于配置** | 遵循众所周知的模式 | 数据库连接从 `DATABASE_URL` 环境变量读取；不需要参数 |
| **消除** | 完全移除参数 | 不是 `thread_safe` 参数，而是一直保持线程安全（成本通常可以忽略） |

### 配置何时合理

配置参数在以下情况下是合理的：
1. **不同的调用者确实需要不同的值**（不仅仅是"将来可能需要"）
2. **模块无法确定正确的值**（它缺少信息）
3. **错误的默认值会造成真正的损害**（而不仅仅是次优性能）
4. **决策在不同部署之间变化**（特定于环境的设置）

### 测试

对每个配置参数，问：
- "模块自己能解决这个问题吗？"如果是，移除该参数。
- "大多数调用者使用相同的值吗？"如果是，将其设为默认值。
- "调用者知道正确的值吗？"如果不是，该参数正在转移复杂性，而不是简化。

## 何时专用是合理的

尽管总体上倾向于通用设计，但在某些情况下专用是合适的：

### 1. 领域专用模块

当模块体现不适合泛化的领域特定知识时。

```python
# Justified specialization: tax rules are inherently domain-specific
class USTaxCalculator:
    def calculate_federal_tax(self, income, filing_status, deductions):
        ...
    def calculate_state_tax(self, income, state):
        ...
```

一个"通用税务计算器"需要了解每个国家的税务系统。专用于美国税务在一个聚焦的接口背后隐藏了巨大的领域复杂性。

### 2. 性能关键路径

当通用抽象引入不可接受的开销时。

```python
# General-purpose: flexible but slow for the hot path
def transform(data, transformer_pipeline):
    for transformer in transformer_pipeline:
        data = transformer.apply(data)
    return data

# Specialized: optimized for the specific hot path
def transform_pixel_rgb_to_hsv(pixels: np.ndarray) -> np.ndarray:
    # SIMD-optimized, no dynamic dispatch, no allocation
    ...
```

### 3. 面向用户的接口

当接口由最终用户（而非开发者）使用时，专门的词汇可以提高可用性。

```python
# General-purpose API: flexible but requires domain knowledge
scheduler.create_recurring_task(
    interval=timedelta(days=7),
    start=next_monday(),
    handler=send_report
)

# Specialized API: matches user mental model
scheduler.send_weekly_report(day="monday", time="09:00")
```

### 4. 适配器和桥接

当连接两个具有不兼容接口的系统时，适配器本质上特定于两者。

```python
class StripeToInternalPaymentAdapter:
    def convert_stripe_event(self, stripe_event) -> InternalPaymentEvent:
        ...
```

## 实用指南

### 设计新模块时

1. 列出所有当前用例
2. 问："覆盖所有这些用例的最简单接口是什么？"
3. 抵制为假设的未来用例添加方法的冲动
4. 将复杂性推入实现，远离接口
5. 默认比你认为需要的稍微通用一些——通常更简单

### 审查现有模块时

| 信号 | 问题 | 操作 |
|--------|---------|--------|
| 许多仅在参数上不同的方法 | 过度专用 | 合并为更少、更通用的方法 |
| 以特定调用者命名的方法 | 耦合到用例 | 围绕概念重命名，而非调用者 |
| 长参数列表 | 复杂性向上推 | 添加默认值、自动检测或吸收决策 |
| 多个相似功能的模块 | 泛化机会 | 提取一个共享的通用模块 |
| "没人碰的"配置 | 应为默认值的参数 | 将它们设为默认值或移除 |

### 添加功能时

在添加新方法或参数之前：
1. 现有方法能否通过其当前接口处理这个？
2. 对现有方法进行轻微泛化能否处理这个？
3. 新方法是否引入了可以避免的特例？

最好的功能是那些不需要修改接口的，因为现有的抽象已经支持它们。

## 与信息隐藏的关系

通用的接口隐藏了**特定用例的知识**。当接口是通用的时，调用者不需要了解其他调用者的用例。这是信息隐藏的一种形式，可以减少调用者之间的依赖。

像 `sendWelcomeEmail()` 这样的专用接口创建了一个依赖：每个看到它的开发者都必须理解欢迎邮件的用例。像 `send(to, subject, body)` 这样的通用接口隐藏了所有特定用例，减少了每个开发者必须记在心中的信息量。

## 总结

目标不是尽可能最通用的设计。而是**满足所有当前需求的最简单接口**。这个最佳点产生的模块：
- 易于使用（方法少、参数少）
- 足够灵活以应对当前需求（不需要变通方案）
- 面向未来（新用例通常符合现有的抽象）
- 深层（通用接口往往隐藏更多的实现复杂性）

当有疑问时，稍微倾向于更通用——它通常更简单。但在构建一个能应对每个可想象的未来需求的框架之前停下来。
