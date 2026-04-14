---
name: site-analyze/whois
description: 只需要查询域名注册商、注册时间、到期时间、注册地或 IP 段归属信息时使用。
---

# WHOIS 查询

## 适用场景

- 用户想知道域名注册商、创建时间、到期时间或注册地。
- 用户给出 IP，想看网段所有者、`inetnum`、`netname` 等信息。
- 只需要注册信息，不需要 DNS / 路由 / 延迟等网络画像。

## 核心约束

- 主脚本是 [`04_whois.py`](04_whois.py)。
- 依赖系统 `whois` 命令；缺失时应明确报错。
- 域名 WHOIS 与 IP WHOIS 字段不同，输出解释要区分。
- `status`、`name_servers` 等多值字段要保留为列表，而不是被后值覆盖。

## 代码模式

```bash
python3 "<skill_dir>/04_whois.py" example.com --json
python3 "<skill_dir>/04_whois.py" 8.8.8.8 --json
```

## 检查清单

- 是否识别了目标是域名还是 IP。
- 是否保留了注册商、注册时间、到期时间和 Name Server。
- 是否保留了网段场景下的 `inetnum` / `netname` / `orgname`。
- 是否把隐私保护导致的字段缺失说明清楚。

## 反模式

- 用域名字段去解读 IP WHOIS。
- 只保留第一条状态，丢掉其他有效状态。
- 命令不存在时静默返回空结果。
- 把 whois 原始输出整段贴给用户，不做结构化提取。
