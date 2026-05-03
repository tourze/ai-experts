---
name: log-analyzer
description: 当用户需要查日志、对齐时间线、关联错误上下文或定位根因时使用。
---

# 日志分析

## 适用场景
- 按时间窗追踪异常请求、崩溃、超时或重试风暴。
- 需要从系统日志和应用日志里抽出关键线索。
- 已知服务异常，但还不知道第一处异常副作用在哪里出现。

## 核心约束
- 先缩小时间范围，再扩大搜索关键词；不要一上来全量扫大日志。
- 读取日志时要告诉用户来源文件或来源命令。
- 输出前必须裁剪或脱敏 token、密码、邮箱和完整 IP。
- 优先找“第一条异常”和“重复模式”，不要只贴最后一条报错。

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
- 如果问题仍未聚焦，转到 [incident-triage](../incident-triage/SKILL.md)。

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
