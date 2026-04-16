---
name: incident-triage
description: 当用户反馈服务异常、性能下降、报错或中断时使用，按证据驱动流程完成分级、假设和根因定位。
---

# 事件分诊

## 适用场景
- “服务挂了”“访问不到”“突然很慢”等泛化故障报告。
- 需要从症状快速分类为服务、性能、网络、认证或数据问题。
- 需要给出只读排查路径和最小修复建议。

## 核心约束
- 先做只读排查，再提出修复动作；未经确认不要重启或改配置。
- 最多先问一个聚焦问题，其他上下文靠命令收集。
- 每次只验证一个假设，记录证据与反证。
- 磁盘、进程状态、错误日志和网络连通性必须优先检查。

## 代码模式
- 初始排查命令：

```bash
systemctl list-units --failed --no-pager
journalctl -p err --since "1 hour ago" --no-pager -n 50
df -h
ss -tlnp
```

- 根因记录模板：

```text
症状：
触发条件：
候选假设：
1. ...
2. ...

根因：
证据：
修复建议：
```

## 检查清单
- 是否先完成故障分类和影响面判断。
- 是否收集到服务状态、最近错误、磁盘空间和端口监听信息。
- 是否给出 2 到 3 个排序后的假设，而不是只盯单点猜测。
- 是否明确根因、影响、临时缓解和长期预防。
- 如果需要深挖日志，转到 [log-analyzer](../log-analyzer/SKILL.md)。
- 如果重点是端点健康和依赖可用性，转到 [service-monitor](../service-monitor/SKILL.md)。

## 反模式

### FAIL: 看到报错就重启

```bash
systemctl restart api && systemctl restart nginx && systemctl restart redis
# 暂时好了 → 1 小时后又挂 → 没人知道根因
```

### PASS: 先只读收集证据

```bash
systemctl status api
journalctl -u api --since "30 min ago"
df -h; free -m
# 证据到手后再决定重启/扩容/回滚/代码修复
```

### FAIL: 同时改多个变量

```
"扩容 + 改配置 + 重启" → 好了 → 不知道哪个起作用
→ 下次同样症状仍不知怎么办
```

### PASS: 逐个验证假设

```
假设 1：磁盘满 → df -h → 否
假设 2：连接池耗尽 → netstat -an | grep ESTAB | wc -l → 是
动作：只改连接池 → 验证恢复 → 归档根因
```
