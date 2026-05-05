## 适用场景
- 新系统上线前补齐监控、日志和告警基线。
- 现网性能或稳定性问题需要补证据链。
- 需要定义 Golden Signals、SLO、告警阈值和 runbook 入口。

## 核心约束
- 先定义业务目标和告警接收人，再定义指标与阈值。
- 指标标签必须控制基数，禁止把用户 ID、订单号这类高基数字段当 label。
- 日志默认结构化输出，严禁记录密码、令牌和原始密钥。
- 健康检查要区分 `live`、`ready`、依赖降级和完全不可用。
- 日志级别纪律：开发环境可用 DEBUG；生产环境默认 INFO，仅需人工介入的事件用 ERROR，WARN 用于即将越限的信号。
- 指标和 trace 围绕系统边界事件布点（入站请求、出站调用、队列消费、定时任务触发），内部纯计算不单独布点。

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
- 需要沿日志追根溯源时，参阅 [log-analyzer](../log-analyzer/SKILL.md)。
- 服务健康检查的 curl/nc/pg_isready/redis-cli 探测细节见 [references/service-monitor.md](references/service-monitor.md)。

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
