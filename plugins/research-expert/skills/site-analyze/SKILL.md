---
name: site-analyze
description: 当需要分析域名或 IP 的 DNS、IP 归属、路由路径、延迟、WHOIS 或 robots 策略时使用。
---

# 站点画像分析

## 适用场景

- 用户要查某个域名或 IP 部署在哪、属于哪个 ISP、是否用了 CDN/GeoDNS、网络质量如何。
- 需要把 DNS、WHOIS、robots、延迟和 traceroute 结果汇总成完整站点画像。
- 如果用户只需要单个维度，直接调用对应脚本：
  `scripts/01_dig.mjs`、`scripts/02_ip_info.mjs`、`scripts/03_traceroute.mjs`、
  `scripts/04_whois.mjs`、`scripts/05_ping.mjs`、`scripts/06_robots.mjs`。

## 核心约束

- 主入口是 [`scripts/analyze.mjs`](scripts/analyze.mjs)。
- `scripts/analyze.mjs` 会优先读取当前版环境缓存，并兼容旧版缓存文件；首次缺失时会自动执行 `scripts/00_probe_env.mjs`。
- 脚本依赖外部命令：`dig`、`whois`、`traceroute`、`ping`；缺失时对应分析项会降级或失败。
- 对域名做综合分析时，默认只对首个解析 IP 做 traceroute，避免整体耗时失控。
- 结果要结合多维证据解释，不要只凭单一 DNS 结果判断机房位置。

## 代码模式

```bash
# <skill_dir> 为当前 SKILL.md 所在目录
node "<skill_dir>/scripts/analyze.mjs" example.com --json

# 关闭 traceroute，加快返回
node "<skill_dir>/scripts/analyze.mjs" example.com --no-traceroute --json

# 指定 TCP 端口用于延迟探测
node "<skill_dir>/scripts/analyze.mjs" example.com --tcp-port 8443 --tcp-port 443

# 首次或需要刷新基准网络环境时执行
node "<skill_dir>/scripts/00_probe_env.mjs" --force
```

```text
单维度脚本
- scripts/01_dig.mjs：国内外 DNS 解析差异、A/AAAA/CNAME、TTL、GeoDNS/CDN 迹象
- scripts/02_ip_info.mjs：公网 IP 国家、城市、运营商、组织、ASN；私网地址直接标记
- scripts/03_traceroute.mjs：路由路径、首个公网出口、跨境跳点、粘贴文本解析
- scripts/04_whois.mjs：域名注册信息或 IP 段归属；多值字段保留为列表
- scripts/05_ping.mjs：ICMP/TCP 时延、丢包率、端口连通性
- scripts/06_robots.mjs：robots.txt、User-agent 分组、Sitemap、Crawl-delay
```

```text
推荐读取顺序
1. Phase 1：dig / whois / robots 并发
2. IP 归属：对解析 IP 做批量归属查询
3. Phase 2：对首个 IP 做 traceroute + ping
4. 汇总：DNS 差异、机房位置、注册信息、路由与时延
```

## 检查清单

- 是否先判断用户要“全量画像”还是单一维度。
- 是否安装了相关外部命令。
- 是否把国内/国外 DNS 差异与 IP 归属一起看，而不是单点下结论。
- 是否识别了私网 IP、超时跳点和 404 robots 等特殊情况。
- 单维度脚本路径是否都能从当前目录解析。

## 反模式

### FAIL: 单 DNS 结果下结论

```bash
dig example.com +short
# 返回 1.2.3.4
# 查 IP 归属 → “AWS us-east-1”
# 结论：”服务部署在美国东部”
→ 实际：全球 GeoDNS，不同地区返回不同 IP
```

### PASS: 多源 + 多地区

```bash
dig @8.8.8.8 example.com +short      # Google DNS
dig @1.1.1.1 example.com +short      # Cloudflare DNS
dig @114.114.114.114 example.com +short  # 国内 DNS
# 对每个 IP 做 whois + ASN 查询
# 看到多个不同归属 → GeoDNS，按地区独立分析
```

### FAIL: traceroute * * * = 链路异常

```
traceroute example.com
...
 5  * * *
 6  * * *
 7  example-router  120ms
→ “链路有问题”
→ 实际：中间跳点禁用 ICMP 回包，链路正常
```

### PASS: 关注首尾 + 延迟累积

```
首跳 (本地网关)：正常
末跳 (目标)：延迟合理
中间若干 * * * 但整体延迟正常 → 忽略
如果末跳延迟暴增或丢包 → 才定性异常
```
