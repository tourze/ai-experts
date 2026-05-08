# Python 精简模式

## 目录

1. [结构模式](#结构模式)
2. [需消除的反模式](#需消除的反模式)
3. [标准库替换](#标准库替换)
4. [类型注解指南](#类型注解指南)
5. [现代 Python (3.10+)](#现代-python)

---

## 结构模式

### 卫语句代替嵌套条件

```python
# 改造前
def process_order(order):
    if order is not None:
        if order.is_valid():
            if order.has_inventory():
                return fulfill(order)
            else:
                return "out of stock"
        else:
            return "invalid order"
    else:
        return "no order"

# 改造后
def process_order(order):
    if order is None:
        return "no order"
    if not order.is_valid():
        return "invalid order"
    if not order.has_inventory():
        return "out of stock"
    return fulfill(order)
```

### 推导式代替累积循环

当逻辑是简单的过滤-映射时，用推导式替代手工 append 循环。不要对复杂多步骤逻辑或有副作用的场景使用推导式。

```python
# 可替换：过滤 + 转换
results = []
for item in items:
    if item.is_active():
        results.append(item.name.lower())
# 改为：
results = [item.name.lower() for item in items if item.is_active()]

# 不要替换：带副作用的复杂逻辑
for item in items:
    validated = validate(item)  # 可能抛出异常
    cache.store(validated)
    results.append(validated.id)
```

### 上下文管理器管理资源清理

任何 open/close、acquire/release、setup/teardown 对都应使用上下文管理器。

```python
# 改造前
f = open(path)
try:
    data = f.read()
finally:
    f.close()

# 改造后
with open(path) as f:
    data = f.read()
```

对于自定义资源，简单场景优先使用 `contextlib.contextmanager` 而非手写 `__enter__`/`__exit__`。

### 数据类代替裸字典/元组

当 dict 有固定 schema 时，替换为 dataclass。可以获得类型检查、不可变选项和可读的属性访问。

```python
# 改造前
config = {"host": "localhost", "port": 8080, "debug": True}

# 改造后
@dataclass(frozen=True)
class Config:
    host: str
    port: int
    debug: bool = False
```

---

## 需消除的反模式

### 裸 `except`

始终捕获特定异常。`except Exception` 作为带日志的最后手段可以接受；裸 `except:` 会捕获 SystemExit 和 KeyboardInterrupt。

### 可变默认参数

```python
# Bug：共享的可变默认值
def append_to(item, target=[]):  # 错误
    target.append(item)
    return target

# 修复：
def append_to(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
```

### 用 `type()` 做类型检查而非 `isinstance()`

`isinstance()` 遵循继承关系，且支持联合检查。

### 循环中的字符串拼接

使用 `"".join()` 或 f-string。对字符串反复 `+=` 会产生 O(n²) 行为。

### 冗余布尔比较

```python
# 改造前
if is_valid == True:
if len(items) > 0:
if result is not None:

# 改造后
if is_valid:
if items:
if result is not None:  # 保留这个——显式 None 检查是有意为之
```

注意：`if x is not None` 和 `if x` 不同。显式 None 检查应保留。

---

## 标准库替换

| 模式 | 替换方案 |
| ----------------------------------------- | --------------------------------------------------------------------- |
| 手工 dict 分组循环 | `collections.defaultdict` 或 `itertools.groupby` |
| `dict.get(k)` 后再检查 None | `dict.setdefault(k, default)` 或 `collections.defaultdict` |
| 手工计数器循环 | `collections.Counter` |
| 带 KeyError 处理的嵌套 dict 访问 | `dict.get(k, {}).get(k2, default)` 或辅助函数 |
| 手工 LRU 缓存 | `functools.lru_cache` 或 `functools.cache` (3.9+) |
| 手工偏函数 | `functools.partial` |
| 手工可迭代对象串联 | `itertools.chain` |
| `os.path.join` + `os.path.exists` | `pathlib.Path` |
| `subprocess.Popen` 执行简单命令 | `subprocess.run` |
| 手工重试循环 | 如果已是依赖可考虑 `tenacity`，否则写一个小辅助函数 |

---

## 类型注解指南

- 所有公开函数签名都要注解（参数 + 返回值）
- 使用 `X | None` (3.10+) 替代 `Optional[X]`
- 使用 `list[str]` (3.9+) 替代 `List[str]`
- 对多次使用的复杂类型使用 `TypeAlias`
- 仅在需要结构化类型时用 `Protocol` 而非 ABC
- 当返回类型依赖输入类型时使用 `@overload`

---

## 现代 Python

### 结构化模式匹配 (3.10+)

用 `match` 替代复杂的类型/结构 if/elif 链：

```python
# 改造前
if isinstance(event, ClickEvent):
    handle_click(event.x, event.y)
elif isinstance(event, KeyEvent) and event.key == "enter":
    handle_submit()
elif isinstance(event, KeyEvent):
    handle_key(event.key)

# 改造后
match event:
    case ClickEvent(x=x, y=y):
        handle_click(x, y)
    case KeyEvent(key="enter"):
        handle_submit()
    case KeyEvent(key=key):
        handle_key(key)
```

仅在 3 个以上分支且模式解构能增加清晰度时使用。

### 异常组 (3.11+)

对并发错误收集，使用 `ExceptionGroup` 和 `except*`。

### `tomllib` (3.11+)

如果只需要读取 TOML，不要引入第三方解析库。
