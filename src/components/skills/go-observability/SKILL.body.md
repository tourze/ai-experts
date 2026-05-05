## 适用场景

- 选型或实施日志（slog）、指标（Prometheus）、链路追踪（OpenTelemetry）、profiling、告警。
- 需要在多条信号间做关联：日志带 trace ID、指标带 exemplar。
- 从 `log.Printf` 迁移到结构化日志，或从零搭建可观测性体系。
- 性能优化中的 pprof/profile → [go-performance](../go-performance/SKILL.md)；生产异常排查 → [go-troubleshooting](../go-troubleshooting/SKILL.md)。

## 五大信号

| 信号 | 职责 | 典型工具 |
|------|------|----------|
| Logs | 记录离散事件，排查上下文 | `log/slog` |
| Metrics | 聚合数值，监控趋势与阈值 | Prometheus client |
| Traces | 跨服务调用链，定位延迟瓶颈 | OpenTelemetry SDK |
| Profiles | 持续性能采样（CPU/内存） | `runtime/pprof`、`net/http/pprof` |
| Alerts | 基于症状的主动通知 | Alertmanager / 规则引擎 |

## 核心约束

- **结构化优先**：所有日志必须用 `slog` 结构化输出，禁止 `fmt.Println` / `log.Printf` 进入生产。
- **信号关联**：日志注入 trace_id 和 span_id；指标 exemplar 关联到 trace。三条信号必须能通过 trace ID 串联。
- **告警面向症状**：告警基于用户可感知的症状（错误率、延迟 P99），不基于内部原因（goroutine 数量、缓存命中率）。
- **日志级别纪律**：DEBUG 开发时用、生产默认 INFO 起步、ERROR 只放需要人工介入的事件。WARN 放可自动恢复的异常。
- **高吞吐采样**：热路径日志用采样 Handler 降低 I/O；指标用 histogram 而非全量日志统计。
- **PII 脱敏**：日志 Handler 层统一拦截敏感字段，不在业务代码逐处处理。

## 常见错误

| 错误 | 修复 |
|------|------|
| 用 `log.Printf` 写生产日志 | 迁移到 `slog.Info`，携带结构化字段 |
| 日志不带 trace_id | slog Handler 自动注入 trace/span ID |
| 指标用 histogram 但桶不合理 | 先看数据分布再配 buckets，或用 `prometheus.DefBuckets` 起步 |
| 告警基于 goroutine 数量 | 改为基于错误率或延迟 P99 的症状告警 |
| 每个请求打多条 INFO 日志 | 热路径用 DEBUG 或采样 Handler |
| 手动拼接日志字段 `fmt.Sprintf` | 用 `slog.With` 预置上下文字段 |
| 指标 label 基数爆炸（user_id 等） | label 只用低基数枚举值 |

## 迁移路径：log.Printf → slog

```
1. 全局替换 log.Printf → slog.Info / slog.Warn / slog.Error
2. 消息字符串拆为 msg + slog.Any/String/Int 字段
3. 共享字段抽到 slog.With 返回的 logger
4. 配置 JSON Handler 输出到 stdout
5. Handler 注入 trace_id / span_id 中间件
6. 生产设 INFO 级别，热路径用采样
```

## 深度参考

- [logging.md](references/logging.md) — slog 模式、Handler 定制、PII 脱敏、采样策略
