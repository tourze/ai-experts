---
name: linux-privilege-escalation
description: "当用户在已授权 Linux 环境中获得低权限 shell，需要枚举并验证提权路径时使用。"
---

# Linux 提权

## 适用场景
- 需要从普通用户态分析 sudo、SUID、capabilities、计划任务、服务配置和内核暴露面。
- 需要在渗透流程中把枚举结果按可利用性排序。
- 需要与 [nmap](../nmap/SKILL.md) 的侦察结果或 [memory-forensics](../memory-forensics/SKILL.md) 的取证结果交叉验证。

## 核心约束
- 先枚举后利用；先用户态配置，再考虑高风险内核路线。
- 任何会影响稳定性的动作都要明确风险，尤其是内核 exploit。
- 不要持久化或清理痕迹，除非用户明确要求。
- 记录当前用户、组、发行版、内核版本和安全模块状态。

## 代码模式
```bash
id
sudo -l
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null
```

## 检查清单
- 确认 sudo 规则、SUID/SGID、capabilities、cron、systemd、可写路径。
- 记录内核版本、容器/宿主机、SELinux/AppArmor 状态。
- 对每条可行路径说明前置条件与影响。
- 优先给出最小影响提权方案。

## 反模式
- 一拿到 shell 就去跑内核 exploit。
- 忽略容器边界，把容器特权误判成宿主 root。
- 未确认影响就修改 systemd/cron 持久化。
