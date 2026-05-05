# Linux 网络排障

## 适用场景

- 用户说“没网了”“解析失败”“端口不通”“连接超时”“curl 握手失败”“服务偶发断开”。
- 需要先拿系统整体快照时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 若怀疑性能退化由网络引起，系统层面排查参考 system-diagnostics。

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



## 反模式

### FAIL: 跳层诊断

```
"HTTPS 握手失败" → 直接 openssl 分析 TLS
→ 实际：ping 网关都不通
```

### PASS: 分层递进

```
1. ip -br addr → 接口 UP
2. ip route    → 默认路由存在
3. ping 网关   → 不通
结论：L2/L3 问题，不必查 TLS
```

### FAIL: refused vs timeout 不分

```
"端口连不上" → 防火墙问题
→ 实际：refused = 服务没监听；timeout = 防火墙/丢包
```

### PASS: 按症状定位

```
Connection refused → ss -tulpen 查监听
timeout            → 查防火墙/路由
no route to host   → ip route
```

### FAIL: 单次 ping 判断间歇问题

```
ping -c 3 example.com  # 全通 → "网络正常"
→ 用户报的是"每 30 分钟抖一次"
```

### PASS: 长时采样

```bash
mtr --report --report-cycles 300 example.com
# 或 ping 跑 10 分钟统计丢包分布
```
