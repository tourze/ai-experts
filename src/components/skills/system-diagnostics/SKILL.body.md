# Linux 系统诊断

## 适用场景

- 用户要做健康检查、系统摸底、上线前巡检、故障前置采样或基础资源审计。
- 若后续需要网络分析，可切到 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 核心约束

- 只运行只读命令；不安装软件、不修改配置、不重启服务。
- 必须同时报告原始指标和解释性结论，不能只给“正常/异常”。
- 某条命令失败时要记录失败原因并继续，不得中断整个诊断。
- 采样时间、主机名、内核、发行版和负载必须出现在报告顶部。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

printf 'host=%s\n' "$(hostname)"
printf 'time=%s\n' "$(date --iso-8601=seconds 2>/dev/null || date)"
cat /etc/os-release
uname -a
uptime
free -h
df -hT
ip -br addr
```

```bash
#!/usr/bin/env bash
set -euo pipefail

ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -15
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -15
systemctl --failed --no-pager
ss -s
journalctl -b -p err..alert --no-pager | tail -n 80
```

## 检查清单

- [ ] 主机名、时间、内核、发行版、启动时长齐全。
- [ ] CPU/负载、内存、磁盘、网络接口、失败服务都被采样。
- [ ] 列出 Top 进程并标明资源热点。
- [ ] 若日志异常，保留最近错误而不是只写“服务异常”。
- [ ] 诊断报告要明确下一步应切换到哪个专用技能。诊断后如需磁盘清理参见 [references/disk-cleanup.md](references/disk-cleanup.md)，如需性能优化参见 [references/performance-optimizer.md](references/performance-optimizer.md)。
- [ ] 如果执行命令失败，报告里记录命令和 stderr 摘要。

## 反模式

### FAIL: 诊断时偷偷改系统

```bash
# 用户："看下系统慢的原因"
systemctl restart nginx     # 自己重启了
apt autoremove              # 顺手清理
sysctl -w vm.swappiness=10  # 调参数
# 原问题复现不了
```

### PASS: 只读采样

```bash
uptime; free -h
ps --sort=-%cpu | head
journalctl -p err..alert --no-pager | tail -80
systemctl --failed --no-pager
```

### FAIL: 只有命令清单无结论

```
跑了 uptime / free / df / top
→ 粘贴 500 行 output → 用户："所以呢？"
```

### PASS: 采样 + 结论 + 下一步

```
指标：load 12.5（应<4）、mem 93%
Top CPU：postgres PID 2341（85% 持续 5 分钟）
结论：CPU 压力来自 PG 慢查询
下一步：切 log-analyzer 查 PG 慢查询日志
```
