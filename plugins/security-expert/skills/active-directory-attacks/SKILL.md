---
name: active-directory-attacks
description: "当用户明确要求在已授权环境中进行 Active Directory 安全测试，或提到 Kerberoasting、DCSync、BloodHound、NTLM Relay、Golden Ticket 等主题时使用。"
---

# Active Directory 攻防

## 适用场景
- 已获得书面授权，需要对域控、域成员、信任关系和高权限路径做系统性评估。
- 需要把前期枚举与后续凭据利用串起来时，可结合 [nmap](../nmap/SKILL.md) 做端口确认。
- 发现 LSASS、票据或转储痕迹后，需要与 [memory-forensics](../memory-forensics/SKILL.md) 联动还原证据链。

## 核心约束
- 只在明确授权范围内操作，禁止对未知生产域做喷洒、relay 或复制类实验。
- 先做时间同步、低噪声枚举和权限确认，再进入票据与横向移动阶段。
- 默认优先验证“是否真的具备攻击前提”，不要把 DCSync、NTDS 导出当成起手动作。
- 记录目标、账户、来源 IP、时间窗口和回滚手段。

## 代码模式
```bash
# 基础端口与域控服务确认
nmap -Pn -p 53,88,135,139,389,445,464,636,3268 10.0.0.10

# AS-REP Roasting
GetNPUsers.py corp.local/ -dc-ip 10.0.0.10 -no-pass -usersfile users.txt

# Kerberoasting
GetUserSPNs.py corp.local/user:pass -dc-ip 10.0.0.10 -request
```

## 检查清单
- 确认域名、DC IP、时钟偏差和测试账户权限。
- 区分枚举、凭据获取、横向移动、持久化四个阶段的证据。
- 对每一步输出保留原始日志与命令参数。
- 高危动作前确认影响面、锁定条件和退出条件。

## 反模式
- 未做时钟校准就直接测试 Kerberos。
- 没有前置证据就直接跑 DCSync、secretsdump 或大规模喷洒。
- 把 BloodHound 路径当成已证实权限链，而不是待验证假设。
