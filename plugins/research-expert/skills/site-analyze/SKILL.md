---
name: site-analyze
description: 需要分析域名或 IP 的 DNS、IP 归属、路由路径、延迟、WHOIS 与 robots 策略时使用，适合做站点画像、机房判断、GeoDNS/CDN 识别与网络质量排查。
---

# 站点画像分析

## 适用场景

- 用户要查某个域名或 IP 部署在哪、属于哪个 ISP、是否用了 CDN/GeoDNS、网络质量如何。
- 需要把 DNS、WHOIS、robots、延迟和 traceroute 结果汇总成完整站点画像。
- 如果用户只需要单个维度，优先切到子 skill：
  [dig](sub/dig/SKILL.md)、
  [ip-info](sub/ip-info/SKILL.md)、
  [traceroute](sub/traceroute/SKILL.md)、
  [whois](sub/whois/SKILL.md)、
  [ping](sub/ping/SKILL.md)、
  [robots](sub/robots/SKILL.md)。

## 核心约束

- 主入口是 [`scripts/analyze.py`](scripts/analyze.py)，Python 依赖见 [`requirements.txt`](requirements.txt)。
- `analyze.py` 会优先读取当前版环境缓存，并兼容旧版缓存文件；首次缺失时会自动执行 `00_probe_env.sh`。
- 脚本依赖外部命令：`dig`、`whois`、`traceroute`、`ping`；缺失时对应分析项会降级或失败。
- 对域名做综合分析时，默认只对首个解析 IP 做 traceroute，避免整体耗时失控。
- 结果要结合多维证据解释，不要只凭单一 DNS 结果判断机房位置。

## 代码模式

```bash
# <skill_dir> 为当前 SKILL.md 所在目录
python3 "<skill_dir>/scripts/analyze.py" example.com --json

# 关闭 traceroute，加快返回
python3 "<skill_dir>/scripts/analyze.py" example.com --no-traceroute --json

# 指定 TCP 端口用于延迟探测
python3 "<skill_dir>/scripts/analyze.py" example.com --tcp-port 8443 --tcp-port 443

# 首次或需要刷新基准网络环境时执行
bash "<skill_dir>/scripts/00_probe_env.sh" --force
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
- 是否安装了 `requests` 以及相关外部命令。
- 是否把国内/国外 DNS 差异与 IP 归属一起看，而不是单点下结论。
- 是否识别了私网 IP、超时跳点和 404 robots 等特殊情况。
- 子 skill 文档与脚本路径是否都能从当前目录解析。

## 反模式

- 用绝对硬编码路径调用脚本。
- 把私网地址当公网归属去查。
- 看到 traceroute 中间 `* * *` 就断定链路异常。
- 只看一个 DNS 结果就下“机房在某地”的结论。
- 修改 `scripts/` 后忘记同步 `sub/` 里的同名脚本副本。
