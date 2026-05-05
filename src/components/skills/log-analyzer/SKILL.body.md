## 代码模式
- 常用筛选命令：

```bash
journalctl --since "30 minutes ago" -p err --no-pager
grep -in "timeout" /var/log/nginx/error.log | tail -50
jq 'select(.level == "error")' app.log | tail -20
```

- 时间线整理模板：

```text
时间线：
10:01:14 API 开始报 502
10:01:16 上游连接被拒绝
10:01:18 健康检查连续失败

推断：
最早异常在上游服务，而不是 Nginx
```

## 检查清单
- 是否明确了时间范围、日志源、关键词和关联 ID。
- 是否提炼出第一条异常、最高频异常和受影响组件。
- 是否补充了上下文行，而不是单独摘一条孤立报错。
- 是否识别出周期性、突发性或发布后回归模式。
- 如果问题仍未聚焦，转到 [incident-response](../incident-response/SKILL.md)。

## 反模式

### FAIL: 贴原始日志让用户自己找

```
"日志：
[10:00:00] INFO ...（5000 行原始输出）
请看一下"
```

### PASS: 提炼关键模式 + 时间线

```
第一条异常：10:01:14 upstream timeout (api.service)
最高频：10:01:14-10:01:35 共 47 次 "connection refused"
影响：api → db-read-replica
推断：只读从库 10:01 宕机，主库仍正常
证据：/var/log/api/error.log:12043-12089
```

### FAIL: 全量扫大日志

```bash
grep "error" /var/log/app/all.log  # 扫 50GB 卡 10 分钟
```

### PASS: 先窗口再关键词

```bash
journalctl -u app --since "10:00" --until "10:15" | grep -i error
```

### FAIL: 分享日志保留敏感信息

```
User login: email=alice@corp.com token=eyJhbGc... password=hunter2
```

### PASS: 脱敏

```
User login: email=a***@corp.com token=<redacted> password=<redacted>
```
