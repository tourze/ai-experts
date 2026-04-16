---
name: service-monitor
description: 当用户需要确认服务是否存活、端点是否响应、依赖是否可达或构建健康巡检时使用。
---

# 服务巡检

## 适用场景
- 确认 HTTP、TCP、数据库或消息队列服务是否可用。
- 快速判断“端口开着”与“业务健康”是否一致。
- 为值班、验收或发布后巡检生成健康看板。

## 核心约束
- 所有网络探测都要加超时，默认不超过 10 秒。
- 不携带凭据做探测；需要认证的健康检查先问用户。
- 单个端点最多做少量采样，避免把巡检变成压测。
- 结果里要区分 `UP`、`DEGRADED`、`DOWN`，不要把 200 简化成一切正常。

## 代码模式
- 常用探测命令：

```bash
curl -sS --max-time 10 -o /dev/null \
  -w "HTTP %{http_code} | Time %{time_total}s\n" https://app.example.com/health
nc -z -w5 db.example.com 5432
pg_isready -h db.example.com -p 5432
redis-cli -h cache.example.com -p 6379 ping
```

- 健康看板输出建议：

```text
Service | Target                  | Status    | Latency
app     | https://app/health      | HEALTHY   | 0.082s
db      | db.example.com:5432     | HEALTHY   | 0.011s
redis   | cache.example.com:6379  | DEGRADED  | timeout
```

## 检查清单
- 是否列出目标服务、端口、协议和依赖链。
- 是否为 HTTP、TCP 和数据库探测分别给出明确结果。
- 是否做了少量重复探测以排除偶发抖动。
- 是否记录响应码、延迟、超时和失败节点。
- 如果服务异常需要进一步分析日志，参阅 [log-analyzer](../log-analyzer/SKILL.md)。
- 如果健康状态涉及系统性故障分诊，参阅 [incident-triage](../incident-triage/SKILL.md)。

## 反模式

### FAIL: 只检查端口监听

```bash
nc -z app.example.com 443  # 端口开着 → "服务健康"
# 实际：Nginx 转发正常，后端全 500
```

### PASS: 检查真实业务端点

```bash
curl -sS --max-time 10 https://app.example.com/health -w "%{http_code}\n"
# /health 内部检查 DB、缓存、MQ，返回聚合状态
```

### FAIL: 无限超时 + 高频重试

```bash
while true; do curl https://failed-api/; sleep 1; done
# 巡检自己卡死 + 对故障端点雪崩
```

### PASS: 限时 + 少量采样

```bash
for i in 1 2 3; do
  curl -sS --max-time 5 https://api/health -w "%{http_code} %{time_total}\n"
  sleep 2
done
```
