---
name: monitoring-observability
description: 当用户需要设计指标、日志、告警、健康检查或可观测性基线时使用。
---

# 监控与可观测性

## 适用场景
- 新系统上线前补齐监控、日志和告警基线。
- 现网性能或稳定性问题需要补证据链。
- 需要定义 Golden Signals、SLO、告警阈值和 runbook 入口。

## 核心约束
- 先定义业务目标和告警接收人，再定义指标与阈值。
- 指标标签必须控制基数，禁止把用户 ID、订单号这类高基数字段当 label。
- 日志默认结构化输出，严禁记录密码、令牌和原始密钥。
- 健康检查要区分 `live`、`ready`、依赖降级和完全不可用。

## 代码模式
- Prometheus 告警规则示例：

```yaml
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "5xx 错误率超过 5%"
```

- 健康检查返回体建议：

```json
{
  "status": "degraded",
  "timestamp": "2026-04-14T10:00:00Z",
  "checks": {
    "database": { "status": "healthy", "latency_ms": 12 },
    "redis": { "status": "unhealthy" }
  }
}
```

## 检查清单
- 是否覆盖延迟、流量、错误率、饱和度四类核心信号。
- 是否为关键依赖提供健康检查和降级语义。
- 是否定义告警等级、通知对象、静默窗口与 runbook 链接。
- 是否确认日志字段、trace id、request id 的一致性。
- 需要在线探测服务健康时，参阅 [service-monitor](../service-monitor/SKILL.md)。
- 需要沿日志追根溯源时，参阅 [log-analyzer](../log-analyzer/SKILL.md)。

## 反模式
- 一上来铺满告警，结果产生告警疲劳。
- 只采系统指标，不采业务成功率或关键路径指标。
- 日志字段无约定，导致跨服务无法关联。
- 把高基数标签写进指标，最终拖垮 Prometheus 或账单。
