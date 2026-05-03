# 时间线模板

每项事件必须包含：UTC 时间、事件描述、来源（log / metric / deploy / config / 外部）、证据链接。

```markdown
| UTC | 事件 | 来源 | 证据 |
|-----|------|------|------|
| 14:32:00 | cart-service deploy v2.4.1 | deploy log | Jenkins #8421 |
| 14:33:15 | cart-service P99 latency 从 200ms → 3s | Prometheus | grafana/d/cart-dashboard |
| 14:33:30 | 用户报障：购物车无法加载 | support ticket | Zendesk #5123 |
| 14:35:00 | oncall 确认 P1，开始响应 | incident channel | Slack #incidents |
```
