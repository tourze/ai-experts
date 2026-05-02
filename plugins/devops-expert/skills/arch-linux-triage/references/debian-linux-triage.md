# Debian 系排障

## 适用场景

- 用户提到 Debian、Ubuntu、apt、dpkg、`unmet dependencies`、`half-configured`、AppArmor 或服务升级后故障。
- 需要系统级健康快照时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 涉及解析失败、镜像源不可达、TLS 或代理链路时，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 核心约束

- 先确认发行版版本、APT 源与锁文件状态，再决定是否修复包数据库。
- 不能盲目删除 `/var/lib/dpkg/status`、`/var/lib/apt/lists` 或锁文件；必须说明原因和前置验证。
- AppArmor 默认是保护机制；只能基于日志定位 profile，不要先停用。
- 系统升级问题要区分“仓库不可达”“签名错误”“依赖冲突”“配置脚本失败”四类。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

cat /etc/os-release
apt-cache policy
sudo systemctl --failed --no-pager
sudo journalctl -b -p err..alert --no-pager | tail -n 80
```

```bash
#!/usr/bin/env bash
set -euo pipefail

sudo dpkg --audit
sudo apt-get update
sudo apt-get -f install
sudo dpkg --configure -a
aa-status
```

## 检查清单

- [ ] 确认 `/etc/os-release`、`apt-cache policy` 与源列表是否一致。
- [ ] 查看 `dpkg --audit`、`dpkg -l | awk '$1 !~ /^(ii|rc)$/'` 的异常包。
- [ ] 检查 `journalctl -u <service>` 与 `systemctl status <service>`。
- [ ] 若是签名或网络问题，先验证时间、CA 证书、DNS 与代理链路。
- [ ] 若是 AppArmor 拒绝，读取 `dmesg | grep DENIED` 或审计日志。
- [ ] 若因磁盘满导致包解压失败，切到 [disk-cleanup](../disk-cleanup/SKILL.md)。

## 反模式

### FAIL: rm dpkg lock

```bash
"另一个 apt 进程在运行" → sudo rm -f /var/lib/dpkg/lock*
→ 中断真正在运行的升级 → dpkg 数据库损坏 → 系统 broken
```

### PASS: 找到原因

```bash
ps aux | grep -E 'apt|dpkg|unattended-upgrade'
# 等其结束 / 必要时 sudo systemctl stop unattended-upgrades.service
sudo dpkg --configure -a  # 修复未配置完成的包
sudo apt-get -f install   # 修依赖
```

### FAIL: 签名失败关 apt-secure

```bash
"InRelease 签名错" → APT::Get::AllowUnauthenticated "true"
→ 中间人攻击窗口大开
```

### PASS: 验证时间 / 镜像 / 密钥

```bash
date  # 系统时间是否正常
sudo apt-get update  # 看具体哪个 repo 失败
# 重新导入密钥：sudo apt-key adv --recv-keys <KEY>
# 或更新 keyring 包
```