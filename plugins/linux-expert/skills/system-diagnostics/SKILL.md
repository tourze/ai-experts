---
name: system-diagnostics
description: "当用户说 Linux 主机变慢、服务异常、需要健康检查、要先摸清系统现状时必须使用。要求执行只读诊断命令、产出结构化快照，并为后续技能提供基线。"
---

# Linux 系统诊断

## 适用场景

- 用户要做健康检查、系统摸底、上线前巡检、故障前置采样或基础资源审计。
- 若后续需要网络分析，可切到 [network-troubleshooter](../network-troubleshooter/SKILL.md)。
- 若后续要做空间释放或提速，可切到 [disk-cleanup](../disk-cleanup/SKILL.md) 或 [performance-optimizer](../performance-optimizer/SKILL.md)。

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
- [ ] 诊断报告要明确下一步应切换到哪个专用技能。
- [ ] 如果执行命令失败，报告里记录命令和 stderr 摘要。

## 反模式

- 不要把 `top` 的一帧截图当成完整诊断。
- 不要在诊断阶段偷偷执行清理、重启、安装包或改 sysctl。
- 不要只有命令清单，没有结论和下一步建议。
- 不要忽略 `journalctl` 与 `systemctl --failed` 这两个最便宜的高价值证据源。
