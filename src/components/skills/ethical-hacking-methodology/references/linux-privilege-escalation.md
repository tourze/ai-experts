
# Linux 提权

## 适用场景
- 需要从普通用户态分析 sudo、SUID、capabilities、计划任务、服务配置和内核暴露面。
- 需要在渗透流程中把枚举结果按可利用性排序。
- 需要与 [nmap](./nmap.md) 的侦察结果或 [memory-forensics](../../memory-forensics/SKILL.md) 的取证结果交叉验证。

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

### FAIL: 上来就内核 exploit

```bash
$ id
uid=1000(www-data)
$ uname -r
5.15.0-100-generic
$ # 直接搜 CVE → 跑 dirty-pipe
$ ./dirty-pipe-exploit  # kernel panic → 服务器宕机
# 客户："你做了什么？"
```

### PASS: 用户态枚举优先

```bash
# 1. 配置类（无破坏性）
sudo -l                          # NOPASSWD 项？
find / -perm -4000 2>/dev/null   # SUID 可滥用？
getcap -r / 2>/dev/null          # 不安全的 capabilities？
ls -la /etc/cron.d/              # 可写的 cron？
# 2. 找到一条用户态路径才考虑动手
# 3. 内核 exploit 是最后手段，需明确风险评估
```

### FAIL: 容器 root = 宿主 root

```bash
# 容器内
$ id
uid=0(root)  # "我是 root！"
$ # 实际：UTS namespace 隔离，cgroup 限制
# 真正的宿主权限取决于 capabilities + AppArmor + seccomp
```

### PASS: 先识别容器边界

```bash
# 1. 是否在容器
ls /.dockerenv 2>/dev/null && echo "Docker"
cat /proc/1/cgroup | grep -E "docker|kubepods"
# 2. 检查容器特权
cat /proc/self/status | grep CapEff
# 3. 寻找逃逸路径：mounted /var/run/docker.sock / privileged / hostPath
```
