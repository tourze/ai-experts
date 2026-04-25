---
name: ethical-hacking-methodology
description: "当用户需要在合法授权范围内规划渗透测试、侦察、漏洞验证、证据留存、风险分级和报告交付时使用。"
---

# 授权渗透测试方法论

## 适用场景
- 需要从信息收集、验证、利用、横向移动到报告闭环组织测试。
- 需要把 [nmap](../nmap/SKILL.md) 的侦察结果和 [wireshark-analysis](../wireshark-analysis/SKILL.md) 的流量证据串起来。
- 需要建立统一的发现分级、证据留存和复测策略。

## 核心约束
- 没有书面授权、范围和时间窗口时不进入实施阶段。
- 先证据化、再利用；先低风险验证、再考虑高影响操作。
- 把目标资产、入口、凭据、影响和回滚方案写清楚。
- 任何越界发现都要立即停止并升级确认。

## 代码模式
```markdown
1. 明确范围、联系人、禁测项和成功标准
2. 低噪声侦察与资产归类
3. 假设驱动验证与复现
4. 控制影响的利用与权限扩展
5. 复测、修复建议与报告归档
```

## 检查清单
- 每个发现都要有证据、影响、利用条件和修复建议。
- 区分已证实风险、潜在风险和待验证假设。
- 记录时间线、工具版本、关键输入和输出。
- 最终报告覆盖范围、限制、发现、复测结论。

## 反模式

### FAIL: 工具输出当结论

```md
## Findings
- nuclei 报告 50 个 CVE
- nikto 报告 30 个 issue
- zap 报告 80 个警告
→ 客户："这些都是真的吗？"
→ 实际：60% 假阳性，工具不知业务上下文
```

### PASS: 工具 → 验证 → 影响

```md
## Finding 001: SQL Injection in /api/search
- 工具发现：sqlmap 报告 time-based blind
- 人工验证：构造 payload `' AND SLEEP(5)--` → 响应延迟 5.2s ✓
- 影响：可读 users 表（含 password_hash）
- 利用复杂度：低（无需认证）
- 业务影响：高（10 万用户 PII 泄漏风险）
- 优先级：P0
```

### FAIL: 范围不清就动手

```
"客户说测他们的系统"
→ 直接扫描 *.client.com
→ 命中第三方 SaaS 子域 → 触发对方 WAF
→ 客户被通知"涉嫌攻击"
```

### PASS: 范围 + 授权先行

```md
## Engagement Scope
- IN scope:  app.client.com, api.client.com (固定 IP: 1.2.3.4)
- OUT scope: cdn.client.com (CloudFlare)、status.client.com (StatusPage)
- 时间窗：2026-04-20 ~ 2026-04-27 工作日 09:00-18:00
- 禁测：DDoS / 社工 / 物理 / 数据破坏
- 紧急联系人：alice@client.com / +86-...
- 书面授权：letter-of-authorization-2026-04.pdf
```
