---
name: debian-linux-triage
description: 当用户遇到 Debian 或 Ubuntu 的 apt、dpkg、systemd、AppArmor、仓库签名或升级故障时使用。
---

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

- 不要把 `rm -f /var/lib/dpkg/lock*` 当作首选修复。
- 不要在未做 `dpkg --audit` 前直接运行大范围卸载或自动清理。
- 不要跳过仓库签名验证去建议关闭 `apt-secure`。
- 不要因为 AppArmor 告警就默认建议 `systemctl disable apparmor`。
