---
name: site-analyze/traceroute
description: 当只需要分析 traceroute 路由路径、首个公网出口、跨境跳点或粘贴的 traceroute 文本时使用。
---

# 路由追踪

## 适用场景

- 用户想知道流量从哪里出境、在哪一跳跨运营商或跨国家。
- 用户直接贴来 traceroute 输出，希望做结构化解析。
- 需要给每一跳公网 IP 补归属信息。

## 核心约束

- 主脚本是 [`03_traceroute.mjs`](03_traceroute.mjs)，复用 [`02_ip_info.mjs`](02_ip_info.mjs) 查询跳点归属。
- 解析 stdin 文本时不能无条件丢掉第一跳，只有 header 行才跳过。
- JSON 输出必须保持纯净，不能把中间查询日志混到 stdout。
- `* * *` 代表节点未响应，不等于整条链路中断。

## 代码模式

```bash
node "<skill_dir>/03_traceroute.mjs" example.com --json
node "<skill_dir>/03_traceroute.mjs" 8.8.8.8 --max-hops 15 --json
printf 'traceroute to x\n 1  192.168.1.1  1.0 ms\n 2  8.8.8.8  10.0 ms\n' | node "<skill_dir>/03_traceroute.mjs" --parse-text --json
```

## 检查清单

- 是否区分了 header 行与真实 hop 行。
- 是否只对公网 IP 做归属查询。
- JSON 模式下 stdout 是否仍是纯 JSON。
- 是否指出了首个公网出口和最后一个可识别节点。

## 反模式

- 把私网跳点也送去公网归属查询。
- 在 JSON 模式下输出额外日志污染解析。
- 看到中间超时就判定整条链路失败。
- 只给 hop 列表，不解释关键跳点意义。
