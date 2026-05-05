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

## 反模式

### FAIL: 高基数标签

```yaml
- name: http_requests_total
  labels: [method, path, user_id]  # user_id 基数 = 用户数！
```

→ 100 万用户 × 10 个 path = 1000 万时间序列，Prometheus OOM。

### PASS: 控制标签基数

```yaml
- name: http_requests_total
  labels: [method, path, status_code]  # 基数 < 1000
```

→ user_id 放日志里用 trace_id 关联，不放指标标签。

### FAIL: 只有系统指标

```
CPU 40%, Memory 60%, Disk 30% → "一切正常"
# 但用户已经无法下单 15 分钟了
```

### PASS: 业务指标 + 系统指标

```yaml
- alert: OrderSuccessRateLow
  expr: sum(rate(orders_completed[5m])) / sum(rate(orders_attempted[5m])) < 0.95
  for: 3m
```
