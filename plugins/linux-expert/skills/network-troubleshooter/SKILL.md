---
name: network-troubleshooter
description: 当用户遇到 Linux 网络不通、DNS 解析异常、端口连不上、连接超时、TLS 报错或链路抖动时使用。
---

# Linux 网络排障

## 适用场景

- 用户说“没网了”“解析失败”“端口不通”“连接超时”“curl 握手失败”“服务偶发断开”。
- 需要先拿系统整体快照时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 若怀疑性能退化由网络引起，可与 [performance-optimizer](../performance-optimizer/SKILL.md) 联动。

## 核心约束

- 必须按链路层 → IP → 路由 → DNS → 端口 → 应用 的顺序排查，不能跳层。
- 先用 IP 验证，再用域名验证，强制拆分 DNS 与路由问题。
- 涉及防火墙、路由、sysctl 修改时，先读取当前配置并征得确认。
- 报告里必须明确“失败点”和“支撑命令”，不是只给猜测。

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

## 检查清单

- [ ] `ip -br addr`、`ip route`、默认网关与接口状态正常。
- [ ] `ping` 网关和公网 IP，确认基本连通性。
- [ ] `getent hosts`、`resolvectl status` 或 `/etc/resolv.conf` 验证 DNS。
- [ ] `ss -tulpen` 与目标端口探测确认监听或出站连接是否存在。
- [ ] `curl -v`、`openssl s_client` 或应用日志验证 L7 故障。
- [ ] 若网络问题由主机资源紧张引发，切到 [performance-optimizer](../performance-optimizer/SKILL.md)。

## 反模式

- 不要网关都 ping 不通时还继续分析 TLS 或应用协议。
- 不要把 `Connection refused` 与 `timeout` 混为一谈，它们指向的层级不同。
- 不要在未确认前提下修改 `iptables`、`nftables`、`firewalld` 或 DNS 配置。
- 不要只跑一次 `ping` 就对间歇问题下结论。
