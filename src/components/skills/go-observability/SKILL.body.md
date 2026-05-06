## 五大信号

| 信号 | 职责 | 典型工具 |
|------|------|----------|
| Logs | 记录离散事件，排查上下文 | `log/slog` |
| Metrics | 聚合数值，监控趋势与阈值 | Prometheus client |
| Traces | 跨服务调用链，定位延迟瓶颈 | OpenTelemetry SDK |
| Profiles | 持续性能采样（CPU/内存） | `runtime/pprof`、`net/http/pprof` |
| Alerts | 基于症状的主动通知 | Alertmanager / 规则引擎 |


## 迁移路径：log.Printf → slog

```
1. 全局替换 log.Printf → slog.Info / slog.Warn / slog.Error
2. 消息字符串拆为 msg + slog.Any/String/Int 字段
3. 共享字段抽到 slog.With 返回的 logger
4. 配置 JSON Handler 输出到 stdout
5. Handler 注入 trace_id / span_id 中间件
6. 生产设 INFO 级别，热路径用采样
```
