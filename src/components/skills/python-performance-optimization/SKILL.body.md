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
