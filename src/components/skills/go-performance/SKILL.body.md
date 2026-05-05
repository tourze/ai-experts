# go-performance

## 适用场景

- 优化热路径延迟、吞吐、内存分配、GC 压力或连接池。
- 写 Go benchmark、用 `benchstat` 比较实现、解释 pprof 输出。
- 审查"性能优化"是否有基线、统计显著性和回归测试。
- 并发瓶颈配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；资源安全配合 [go-safety](../go-error-handling/SKILL.md)。
- 持续监控 → go-observability；排查"为什么慢" → go-troubleshooting。

## 核心约束

- 没有基线不优化；先定义目标指标，再写 benchmark 或采集 profile。
- 一次只改一个变量，改前改后用同一命令多次采样，再用 `benchstat` 比较。
- 优先优化已证实的瓶颈：CPU profile、heap profile、trace、mutex/block profile 或生产指标。
- 先排除外部瓶颈：数据库、网络、锁等待、上游 API 慢时，减少本地分配通常无效。
- 优化代码必须保留可读性解释和 benchmark 证据，避免后续被误删。
- `sync.Pool`、`unsafe`、手写缓存只在 profile 证明收益并有测试保护时使用。

## 优化决策树

遇到性能问题时的排查路径：

```
性能问题
├─ 外部瓶颈？(DB/网络/上游API) → 先优化外部
├─ CPU 热点？
│   ├─ 算法复杂度 → 换算法/数据结构
│   ├─ 热路径分配过多 → 减少逃逸、对象复用、sync.Pool
│   └─ 系统调用密集 → 批量化、异步化
├─ 内存压力？
│   ├─ 分配速率高 → pprof -alloc_objects 定位
│   ├─ GC 暂停长 → 减少堆上存活对象、调 GOGC
│   └─ 持续增长 → goroutine 泄漏、全局缓存无上限
├─ 锁竞争？
│   ├─ 临界区太长 → 缩小锁粒度、分片
│   └─ 读写比低 → RWMutex 或 copy-on-write
└─ 并发度不足？→ 调大 errgroup.SetLimit 或 fan-out
```

**Diagnose:**
1- `go tool pprof -alloc_objects` — 分配最多的函数
2- `go build -gcflags="-m"` — 逃逸分析，找 "moved to heap"
3- `go tool trace` — goroutine 调度延迟和阻塞

## 常见错误

| 错误 | 修复 |
|------|------|
| 无基线就优化 | 先写 benchmark 采集基线，再改 |
| 单次采样下结论 | `benchstat` 至少 8 次采样 |
| 优化外部瓶颈 | 先排除 DB/网络延迟，再改 Go 代码 |
| 逃逸分析盲区 | `go build -gcflags="-m"` 检查 |
| 结构体字段乱序 padding | `fieldalignment` 工具，按大小降序排列 |
| `sync.Pool` 用于长期对象 | Pool 只适合短生命周期临时对象 |
| 优化删了正确性测试 | 优化必须保留正确性测试 |

## 深度参考

- [benchmarking.md](references/benchmarking.md) — benchstat、统计显著性、CI 回归、b.Loop()
- [pprof.md](references/pprof.md) — CPU/heap/mutex/block/trace profile 深度工作流
