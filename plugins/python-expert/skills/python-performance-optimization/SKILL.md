---
name: python-performance-optimization
description: 当用户要分析 Python 性能瓶颈、做 profiling、降低延迟、减少内存占用或建立可复现实验时使用。
---

# Python 性能优化

## 适用场景

- 请求慢、任务慢、CPU 高、内存涨，需要先找瓶颈再优化。
- 需要比较不同算法、数据结构或缓存策略的收益。
- 需要给数据库、I/O、批处理、异步并发做针对性优化。
- 更复杂的 NumPy、并行和缓存策略见 [references/advanced-patterns.md](references/advanced-patterns.md)。
- 异步 I/O 优化时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。
- 结构层面的复杂度治理时，联动 [python-design-patterns](../python-design-patterns/SKILL.md)。

## 核心约束

- 没有测量就不要优化；先 profile，再改代码。
- 一次只改一个变量，并用同一组输入做前后对比。
- 先做算法和数据结构级优化，再考虑微调语法糖。
- benchmark 要写明输入规模、运行轮次和环境，不要凭感觉说“更快”。
- 不为了局部速度把代码可读性和可维护性直接打穿。

## 代码模式

```python
import cProfile
import pstats
import time
from collections.abc import Callable
from dataclasses import dataclass


@dataclass(slots=True)
class BenchmarkResult:
    label: str
    elapsed_ms: float


def measure(label: str, fn: Callable[[], object]) -> BenchmarkResult:
    start = time.perf_counter()
    fn()
    elapsed_ms = (time.perf_counter() - start) * 1000
    return BenchmarkResult(label=label, elapsed_ms=elapsed_ms)


def profile_callable(fn: Callable[[], object]) -> None:
    profiler = cProfile.Profile()
    profiler.enable()
    fn()
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats("cumtime")
    stats.print_stats(10)
```

## 检查清单

- 已用 profiler 或 benchmark 证明热点在哪里。
- 已确认瓶颈是 CPU、内存、数据库、网络还是锁竞争。
- 优化前后使用相同输入规模和相同运行环境对比。
- 优化带来的复杂度是否值得维护成本。
- 已保留回归基线，避免以后“优化”把性能改坏却无从发现。

## 反模式

- 一上来就加缓存、并发或 C 扩展，却没确认热点。
- 拿一次运行结果当最终结论。
- 把 I/O 问题错当成 CPU 问题处理。
- 为了追求极限性能写出团队无法维护的技巧代码。
- 优化后不补 benchmark，下一次改动又回退到原点。
