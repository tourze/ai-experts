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
