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
