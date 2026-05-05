## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

target_host="example.com"
target_port="443"

ip -br addr
ip route
resolvectl status 2>/dev/null || cat /etc/resolv.conf
ping -c 3 1.1.1.1
getent hosts "$target_host"
ss -tulpen | head
timeout 5 bash -c "cat </dev/null >/dev/tcp/$target_host/$target_port"
```

```bash
#!/usr/bin/env bash
set -euo pipefail

target_host="example.com"
curl -Ivs --max-time 10 "https://$target_host/" 2>&1 | sed -n '1,20p'
traceroute -n "$target_host" 2>/dev/null || tracepath "$target_host"
```
