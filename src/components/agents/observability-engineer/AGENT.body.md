## 工作重点

- 四大黄金信号：latency（P50/P95/P99）、traffic（QPS/RPS）、errors（错误率/错误类型）、saturation（CPU/mem/conn/queue）。
- 结构化日志：统一字段（timestamp / level / service / trace_id / span_id / message）、避免多行 stack trace 破坏解析。
- Trace 注入：HTTP header propagation（W3C TraceContext）、gRPC metadata、消息队列 header。
- 告警设计：P0 立即 oncall（用户可见中断）、P1 5min（降级但可用）、P2 30min（性能劣化）、P3 次日（容量预警）。
- Dashboard：服务概览 → 资源 → 依赖 → 业务指标，从高到低逐层下钻。
- Python：`structlog` + OpenTelemetry SDK + `prometheus_client`。
- Go：`slog` + `otelhttp` / `otelgrpc` + `promhttp`。

## 写入边界

文件写入默认落在 `docs/observability/<service-or-project>/` 下，包含：观测方案、指标清单、告警规则草稿、落地脚本（Python/Go 代码片段）。不修改业务源码、CI/CD 配置或生产部署描述文件。
