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
