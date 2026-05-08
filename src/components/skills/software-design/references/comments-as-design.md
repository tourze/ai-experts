# 注释作为设计文档

注释是软件工程中争议最大的话题之一。Ousterhout 认为注释不仅仅是辅助性的——它们是至关重要的设计文档，捕获了代码无法表达的信息。认为"好的代码是自文档的"这一观点对于实现细节而言部分正确，但对于抽象、设计决策和横切关注点来说，是危险的错误。

## 为什么注释很重要

代码告诉你程序**做什么**。注释告诉你：
- **为什么**要这样实现
- **什么**是抽象的承诺（契约）
- **什么**是代码做出的假设
- **什么**是曾被考虑但被拒绝的替代方案
- **什么**约束将这个代码链接到其他模块
- **什么**是阅读代码时不易察觉的信息

没有注释，这些信息只存在于原始开发者的头脑中。当该开发者离开时，信息就丢失了。未来的开发者必须从实现中逆向工程意图——这是一个容易出错的过程，会导致错误的变更和不断累积的复杂性。

## 四种注释类型

### 1. 接口注释

**目的：** 定义模块、类或函数向其使用者呈现的抽象。

**这是最重要的注释类型。** 接口注释构成了模块与其调用者之间的契约。它们应描述：
- 函数/方法做什么（在抽象层面）
- 每个参数的含义及约束
- 返回值的含义
- 会发生的副作用
- 可能抛出的异常及条件
- 调用者必须确保的前提条件
- 调用者可以假设的后置条件

**示例：**

```python
def find_nearest(target: Point, candidates: list[Point],
                 max_distance: float = inf) -> Point | None:
    """Find the candidate point closest to target.

    Returns the nearest point from candidates, or None if no candidate
    is within max_distance of target. If multiple candidates are
    equidistant, returns the one that appears first in the list.

    Args:
        target: The reference point to measure distances from.
        candidates: Points to search. Must not be empty.
        max_distance: Maximum Euclidean distance to consider.
            Points farther than this are ignored. Defaults to
            infinity (consider all points).

    Returns:
        The nearest Point, or None if all candidates exceed
        max_distance.

    Raises:
        ValueError: If candidates is empty.
    """
```

```java
/**
 * Acquire a database connection from the pool.
 *
 * Blocks until a connection is available or the timeout expires.
 * The returned connection is guaranteed to be valid (tested with
 * a lightweight query before returning). The caller MUST close
 * the connection when done, which returns it to the pool.
 *
 * @param timeout maximum time to wait for a connection
 * @return a valid, open database connection
 * @throws TimeoutException if no connection is available within timeout
 * @throws PoolExhaustedException if the pool is permanently full
 *     (all connections in use and at max capacity)
 */
public Connection acquire(Duration timeout)
```

**接口注释的关键规则：**
- 描述抽象，而不是实现
- 如果注释提到了实现细节（算法、数据结构、内部变量），说明太详细了
- 开发者应该只通过阅读接口注释就能正确使用模块，无需阅读任何实现代码
- 如果你无法写出清晰的接口注释，接口设计可能有问题

### 2. 数据结构成员注释

**目的：** 解释类或数据结构中字段的含义、约束和不变量。

字段名本身很少能传达开发者需要的所有信息。注释应阐明：
- 字段代表什么（尤其是名称有歧义时）
- 单位和编码（毫秒？秒？UTC？本地时间？）
- 有效范围和边界条件
- 与其他字段的关系
- 何时设置该字段以及何时可能为 null/零

**示例：**

```python
class RetryConfig:
    # Maximum number of retry attempts before giving up.
    # Does not count the initial attempt, so total attempts = max_retries + 1.
    # Set to 0 to disable retries.
    max_retries: int

    # Base delay between retries in milliseconds.
    # Actual delay uses exponential backoff: base_delay_ms * 2^attempt.
    # Jitter of +/- 20% is applied to prevent thundering herd.
    base_delay_ms: int

    # Maximum delay cap in milliseconds. Exponential backoff will
    # not exceed this value regardless of attempt number.
    # Must be >= base_delay_ms.
    max_delay_ms: int
```

```java
class PageCache {
    // Maps page_id to cached page content. Entries are evicted
    // in LRU order when the cache exceeds maxEntries. A page
    // present in this map is guaranteed to match the on-disk
    // version as of the last sync (see lastSyncTime).
    private Map<Long, Page> cache;

    // Timestamp of the last cache synchronization with disk,
    // in epoch milliseconds (UTC). All cache entries are valid
    // as of this time. Writes after this time may not be reflected.
    private long lastSyncTime;

    // Upper bound on cache entries. When exceeded, the least
    // recently accessed entry is evicted before inserting a new one.
    // Invariant: cache.size() <= maxEntries at all times.
    private int maxEntries;
}
```

### 3. 实现注释

**目的：** 解释**为什么**代码以某种特定方式实现，或澄清不明显的逻辑。

实现注释不应描述代码**做什么**——这应该从阅读代码本身就能看出。它们应解释：
- 为什么选择了这种方法而非其他替代方案
- 代码处理了什么不明显的约束或边缘情况
- 如果以看似显而易见的方式修改代码会出什么问题
- 驱动实现选择的性能考量

**好的实现注释：**

```python
# Use binary search instead of linear scan because the list is sorted
# and can contain 100k+ entries. Linear scan caused 200ms latency
# in production (see incident #4521).
index = bisect.bisect_left(sorted_entries, target)
```

```python
# Process items in reverse order to avoid index invalidation when
# removing elements. Forward iteration would skip elements after
# each removal.
for i in range(len(items) - 1, -1, -1):
    if should_remove(items[i]):
        items.pop(i)
```

```python
# Intentionally catching broad Exception here because the third-party
# library can throw undocumented exceptions (observed RuntimeError,
# ValueError, and OSError in production). We log and continue rather
# than crash the batch job.
try:
    result = third_party_lib.process(data)
except Exception as e:
    logger.warning(f"Processing failed for {data.id}: {e}")
    result = default_result()
```

**不好的实现注释（只是复述代码）：**

```python
# Increment counter
counter += 1

# Check if user is active
if user.is_active:

# Loop through items
for item in items:

# Return the result
return result
```

这些注释没有添加任何信息。代码已经说出了它的功能。删除它们。

### 4. 跨模块注释

**目的：** 记录跨多个模块的依赖关系和设计决策。

这些是最难维护但通常最关键的注释，因为跨模块关系是最大的未知未知来源。

**示例：**

```python
# This timeout value must be longer than the retry timeout in
# RetryPolicy (currently 30s with 3 retries = 90s max). If this
# timeout is shorter, the caller will give up before retries complete.
# See: src/retry/policy.py:RetryPolicy.MAX_TOTAL_DURATION
REQUEST_TIMEOUT_SECONDS = 120
```

```python
# The field order in this struct must match the binary protocol
# defined in docs/protocol-v3.md section 4.2. The client parser
# (client/src/parser.rs) reads fields in this exact order.
# Changing field order here requires updating both the docs and
# the client parser.
class ServerMessage:
    version: int      # 2 bytes, big-endian
    message_type: int # 1 byte
    payload_len: int  # 4 bytes, big-endian
    payload: bytes    # payload_len bytes
```

```java
/**
 * IMPORTANT: This method is called by the EventBus on a background
 * thread. It must not access the UI thread directly. Use
 * Platform.runLater() for any UI updates.
 *
 * The EventBus guarantees at-least-once delivery, so this handler
 * must be idempotent. See EventBus.subscribe() docs for details.
 */
public void onOrderCompleted(OrderCompletedEvent event) {
```

**跨模块注释的最佳实践：**
- 将注释放在开发者最可能查找的位置
- 明确引用其他模块（文件路径、类名）
- 解释如果关系被违反会出什么问题
- 考虑对必须保持同步的值使用共享常量文件

## 注释驱动设计

**在编写代码之前先编写注释。**

这是 Ousterhout 最实用的建议之一。过程如下：

1. **先写接口注释：** 在写任何实现代码之前，先写描述函数/类/模块功能、参数含义和返回值的注释。

2. **评估设计：** 如果接口注释难以写出、不清楚或需要提及实现细节，接口设计可能有问题。重新设计接口，直到注释干净简洁。

3. **实现代码：** 以清晰的接口注释作为指导，实现就有了明确的目标。

4. **添加实现注释：** 在写代码时，为任何不明显的决策添加注释。

### 为什么注释驱动设计有效

| 好处 | 解释 |
|---------|-------------|
| 迫使清晰思考 | 在一个东西做什么之前先写它做什么，能及早揭示混淆 |
| 捕获错误的抽象 | 如果你不能简单地描述接口，说明它太复杂了 |
| 产生更好的接口 | 写注释的行为能澄清调用者真正需要什么 |
| 注释保持准确 | 与设计同时编写，而不是事后补充 |
| 节省时间 | 避免实现一个最终被证明是错误的方案 |

### 示例

**第 1 步：** 编写接口注释。

```python
def merge_sorted_streams(*streams: Iterator[T],
                          key: Callable = None) -> Iterator[T]:
    """Merge multiple sorted iterators into a single sorted iterator.

    Each input stream must be sorted in ascending order (or by key
    if provided). The output yields all elements from all streams
    in globally sorted order. Memory usage is O(num_streams),
    regardless of stream length.

    Equal elements are yielded in the order their source streams
    appear in the arguments (stable merge).
    """
```

**第 2 步：** 评估。这清晰吗？调用者能否在不阅读实现的情况下使用它？边缘情况呢——空流、单个流、重复元素？如果需要，添加那些细节。

**第 3 步：** 实现。注释现在就是规范。

## "自文档化代码"的神话

"好的代码不需要注释"这种说法包含了一点真理，但危险地不完整。

### 自文档化代码有效的地方

代码**可以**为底层实现细节自文档化：

```python
# This is self-documenting -- no comment needed:
total_price = sum(item.price for item in cart.items)
is_eligible = user.age >= 18 and user.has_valid_id
filtered = [x for x in data if x.is_active and x.score > threshold]
```

好的变量名、清晰的控制流程和简单的表达式使**做什么**显而易见。复述这些的注释是噪音。

### 自文档化代码失败的地方

代码**无法**记录：

| 信息 | 为什么代码无法表达 | 示例 |
|------------|--------------------------|---------|
| **抽象** | 代码显示实现，而不是承诺 | 接口的契约和保证 |
| **为什么** | 代码显示发生了什么，而不是为什么选择这种方法 | 为什么用二分搜索而不是哈希查找 |
| **约束** | 代码强制执行约束但不解释它们 | 为什么超时设置为 120 秒 |
| **设计替代方案** | 代码显示做出的选择，而不是被拒绝的选择 | 为什么选择轮询而不是 webhook |
| **跨模块关系** | 一个模块中的代码无法描述与另一个模块的关系 | 此超时必须与重试配置匹配 |
| **性能理由** | 优化后的代码往往可读性较差 | 为什么我们反规范化了此数据结构 |
| **假设** | 代码在它无法声明的假设上运行 | "此列表总是由调用者排序" |

### 实用规则

**使用自文档化代码来表达"做什么"（实现）。使用注释来表达"为什么"（设计决策）、更高层次的"做什么"（抽象/接口）以及"注意"（不明显的约束和关系）。**

## 维护注释

错误的注释比没有注释更糟糕。以下是保持其准确性的策略：

### 1. 将注释放在代码附近

注释越靠近它描述的代码，在代码变更时就越有可能被更新。函数签名中的接口注释比单独的文档文件中的注释更好。

### 2. 避免重复信息

如果相同的信息既在注释中陈述又在代码中强制执行，其中一条最终会过时。每条信息只陈述一次。

```python
# Bad: duplicates the type annotation
# max_retries is an integer representing the maximum number of retries
max_retries: int  # The type already says it's an int

# Good: adds information not in the code
# Set to 0 to disable retries. Values > 10 are capped at 10 to prevent
# excessive load on the downstream service during outages.
max_retries: int
```

### 3. 在同一个提交中更新注释

将其作为代码审查规范：如果你改变了函数的行为，必须在同一个提交中更新其接口注释。过时的注释是代码审查的发现项。

### 4. 将注释用作设计坏味道检测器

如果注释难以写出，代码可能太复杂了。如果注释需要非常长，接口可能做得太多。如果注释不断过时，模块的边界可能有问题。困难的注释是一个信号，而不仅仅是麻烦事。

### 5. 将注释质量作为审查标准

在代码审查中，像评估代码一样评估注释：
- 接口注释是否完整准确？
- 实现注释是否解释为什么，而不是做什么？
- 跨模块注释是否在需要的地方出现？
- 不明显的代码上是否缺少注释？

## 注释反模式

| 反模式 | 问题 | 修复 |
|-------------|---------|-----|
| **注释重复代码** | 增加噪音，无信息 | 删除；让代码自己表达实现细节 |
| **注释描述做什么，而不是为什么** | 错过了有价值的信息 | 重写以解释理由或设计决策 |
| **每行都有注释** | 遮蔽代码，难以维护 | 只注释不明显的段落；信任清晰代码 |
| **无上下文的 TODO** | "TODO: fix this" 数月后无用处 | 包含问题编号、问题和修复方向 |
| **注释掉的代码** | 死代码混淆读者 | 删除；版本控制保留了历史 |
| **横幅注释** | `/////// SECTION ///////` 添加结构但不添加信息 | 改用有意义的函数/类边界 |
| **道歉注释** | "抱歉，这是个 hack" 承认问题但不修复 | 修复 hack 或添加上下文说明其必要性和修复时机 |
| **过时注释** | 描述不再存在的行为 | 在与代码变更相同的提交中更新或移除 |

## 总结

注释不是坏代码的标志。它们是设计文档，捕获了系统中最有价值也最易消失的信息：设计者的意图、抽象的契约以及组件之间不明显的关联。先写接口注释，与代码一起维护，并将注释作为清晰思考设计的工具。
