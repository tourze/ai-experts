---
name: site-analyze/dig
description: 当只需要查看域名的国内外 DNS 解析差异、A/AAAA/CNAME 记录和 GeoDNS/CDN 迹象时使用。
---

# DNS 解析

## 适用场景

- 用户要查某个域名解析到了哪些 IP。
- 需要比较国内外 DNS 返回是否一致，判断是否存在 GeoDNS 或 CDN 调度。
- 如果还要补 WHOIS、延迟、路由等信息，回到 [站点画像总览](../../SKILL.md)。

## 核心约束

- 主脚本是 [`01_dig.mjs`](01_dig.mjs)。
- 先走 `dig` 直查 UDP 53，全部为空时再回退到 DoH。
- 结论要同时看 A/AAAA 记录、TTL 和各 DNS 服务器差异。
- 只返回结构化事实，不要把“解析差异”直接等同于“真实源站位置”。

## 代码模式

```bash
# <skill_dir> 为当前 SKILL.md 所在目录
node "<skill_dir>/01_dig.mjs" example.com --json
```

## 检查清单

- 是否比较了阿里与 Google 的返回结果。
- 是否识别了 CNAME 链与唯一 IP 集合。
- 是否注意到了 DoH 回退是否被触发。
- 是否把 TTL 过短视作 CDN/动态 DNS 的线索，而不是绝对证据。

## 反模式

- 只查一个 DNS 服务器就下结论。
- 忽略 CNAME 链。
- 把 AAAA 缺失误判为异常。
- 把 DNS 差异直接说成“源站一定在某地”。
