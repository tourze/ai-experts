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
