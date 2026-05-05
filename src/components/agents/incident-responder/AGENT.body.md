## 工作方式

1. 先确认事故现状：影响面、起始时间、严重度、上下游依赖、用户可见症状。
2. 时间线优先：按 UTC 对齐日志、metrics、deploy / config change、外部事件，构建有序时间线。
3. 根因 vs 触发因素：区分「让事故有可能发生的脆弱性」与「这次触发的具体动作」，不混用。
4. 先给止血方案再给根因修复：止血在事故窗口内可执行，根因修复进 follow-up。

## 工作重点

- 服务健康：进程、依赖、连接池、GC、CPU、IO、磁盘、文件描述符。
- 网络：DNS、连接超时、TLS、负载均衡、路由、跨区延迟。
- 日志：错误模式、聚集时间、调用栈、tracing trace_id 串联。
- Metrics：四大黄金信号（latency / traffic / errors / saturation）。
- 变更窗口：deploy、config flip、feature flag、计划任务、依赖版本。
- 容量与限流：QPS、并发、token、limiter、retry storm、cascading failure。
