---
name: go-troubleshooting
description: 当 Go 程序出现异常行为需要排查：CPU 飙高、内存泄漏、goroutine 泄漏、死锁、竞态、panic 或性能回归时使用。
---

# go-troubleshooting

## 适用场景

- Go 程序出现 CPU 飙高、内存持续增长、goroutine 泄漏、死锁、数据竞争或性能回归。
- 需要用 pprof/delve/race detector/GODEBUG 定位根因。
- 生产环境异常排查：crash 日志分析、stack trace 解读、运行时 profile 采集。
- 优化方法论和 benchmark 验证 → [go-performance](../go-performance/SKILL.md)。
- goroutine/channel 死锁与泄漏模式 → [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)。
- panic 恢复与运行时安全 → [go-safety](../go-error-handling/SKILL.md)。

## 调试决策树

```
异常现象
├─ crash / panic？
│   ├─ 读 stack trace 定位触发点
│   └─ 区分 nil pointer / index OOB / type assertion / concurrent map write
├─ 进程存活但行为异常？
│   ├─ 收集日志 + 指标
│   └─ pprof 采集 CPU/heap/goroutine profile
├─ 能否稳定复现？
│   ├─ 能 → 构造最小复现用例
│   └─ 不能 → 增加日志/pprof HTTP 端点到生产
└─ 根因定位
    ├─ 形成假设（一次一个）
    ├─ 改一个变量，验证
    └─ 假设失败则记录，换下一个假设
```

## 核心约束

- **先复现再修复**：无法复现的 bug 先增加可观测性（日志/pprof 端点），不盲改。
- **一次一个假设**：同时改多处 = 放弃定位能力；失败的假设要记录，避免重复。
- **修根因不修症状**：下游吞异常、放宽校验、加 retry 掩盖问题一律禁止。
- **证据先行**：日志/trace/profile/stack trace 排在假设前面；凭经验猜排序是反复出错的主因。
- **红牌警告**：
  - 没复现就提 PR → 停下
  - 一次改两个以上变量 → 停下
  - 用 `_ = err` 吞掉错误 → 停下

## 常见错误

| 错误 | 正确做法 |
|------|----------|
| 未复现就改代码 | 先构造最小复现，再提假设 |
| 同时改多处 | 一次改一个变量，逐步验证 |
| 用 log.Fatal 吞上下文 | 返回 error 让调用方决定 |
| 只看日志不看 profile | CPU/内存问题必须用 pprof 定量 |
| goroutine 只开不关 | 检查退出路径，配合 context 取消 |
| data race 靠肉眼查 | `go test -race ./...` 必须跑 |
| 线上加了 fmt.Println 调试 | 用 delve 或 pprof HTTP 端点 |

## 深度参考

- [methodology.md](references/methodology.md) — 结构化调试流程、假设驱动、二分法、stack trace 解读
- [diagnostic-tools.md](references/diagnostic-tools.md) — pprof/delve/GODEBUG/race detector 速查
