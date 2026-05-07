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
