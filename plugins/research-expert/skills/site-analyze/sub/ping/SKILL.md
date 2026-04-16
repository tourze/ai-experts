---
name: site-analyze/ping
description: 当只需要测目标主机的 ICMP 与 TCP 时延、丢包率和端口连通性时使用。
---

# 延迟探测

## 适用场景

- 用户要测某个主机的延迟、丢包率或端口可达性。
- 需要区分“ICMP 被屏蔽”和“TCP 端口不可达”。
- 如果还要结合 DNS、WHOIS 或 traceroute，回到 [站点画像总览](../../SKILL.md)。

## 核心约束

- 主脚本是 [`05_ping.py`](05_ping.py)。
- 默认会同时跑 ICMP 与 TCP:80/443；如需其他端口，用 `--tcp-port` 明确传入。
- ICMP 不通不等于服务不可达，必须同时看 TCP 结果。
- 结果解释要区分平均时延、最大时延和丢包率。

## 代码模式

```bash
python3 "<skill_dir>/05_ping.py" example.com --json
python3 "<skill_dir>/05_ping.py" example.com --count 10 --tcp-port 443 --tcp-port 8443 --json
```

## 检查清单

- 是否同时查看了 ICMP 与 TCP 结果。
- 是否标注了端口号，而不是只写“TCP”。
- 是否把高丢包和端口拒绝区分开。
- 是否避免把单次尖峰延迟当成稳定结论。

## 反模式

- ICMP 超时就说“站点挂了”。
- 不写端口号就输出 TCP 结果。
- 忽略丢包率，只看平均值。
- 把几次采样的结果说成长期网络质量。
