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
