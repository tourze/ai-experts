---
name: site-analyze/ip-info
description: 当只需要查询一个或多个 IP 的国家、城市、运营商、组织和 ASN 时使用，支持自动跳过私网地址。
---

# IP 归属

## 适用场景

- 用户给了公网 IP，想知道机房、国家、城市、ISP 或 ASN。
- 需要批量查询多个 IP 并合并为统一结果。
- 如果这些 IP 来自 traceroute 或 dig，可与 [站点画像总览](../../SKILL.md) 联动解读。

## 核心约束

- 主脚本是 [`02_ip_info.py`](02_ip_info.py)。
- 结果来自 ip-api 与 ipinfo 双源，优先用 ip-api，缺失字段再补 ipinfo。
- 私网地址会直接标记为内网，不应继续对外查询。
- 批量查询允许并发，但不能因为全是私网地址而崩溃。

## 代码模式

```bash
python3 "<skill_dir>/02_ip_info.py" 8.8.8.8 --json
python3 "<skill_dir>/02_ip_info.py" 1.1.1.1 8.8.8.8 223.5.5.5 --json
printf '10.0.0.1\n8.8.8.8\n' | python3 "<skill_dir>/02_ip_info.py" --stdin --json
```

## 检查清单

- 是否区分了私网和公网地址。
- 是否在批量场景下保持每个 IP 都有结果。
- 是否把 ASN / org / ISP 区分开。
- 是否把查询失败显式标出来，而不是吞掉异常。

## 反模式

- 把私网地址丢给外部 IP 归属服务。
- 只返回一个来源，丢失补充字段。
- 批量输入里只要有失败就整批报错退出。
- 把组织名和城市名混成一句无法复核的描述。
