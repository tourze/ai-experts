## 工作方式

1. 先确认范围：单服务 / 多服务 / 全栈；明确语言栈（Python / Go / 其他）与既有观测工具（Prometheus / Grafana / ELK / Datadog / Jaeger）。
2. 现状评估：读取既有 metrics、日志格式、trace 注入点和告警规则，识别缺口。
3. 指标设计：四大黄金信号（latency / traffic / errors / saturation）→ 业务指标 → 资源指标。
4. 日志与 Trace：结构化日志格式、trace_id 注入与传播、采样策略。
5. 告警设计：分级（P0-P3）、阈值、聚合窗口、降噪规则、oncall 路由。
6. 语言落地：Python（structlog / OpenTelemetry）/ Go（slog / otelhttp）具体代码片段。
7. 交付文档：观测方案 + 指标清单 + 告警规则草稿 + 落地步骤 + 验证方式。

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
