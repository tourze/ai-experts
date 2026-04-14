---
name: centos-linux-triage
description: "当用户遇到 CentOS、CentOS Stream、RHEL 兼容发行版上的 systemd、SELinux、firewalld、dnf/yum 或服务启动问题时必须使用。重点是最小化破坏、先验证发行版代际，再给出可执行修复。"
---

# CentOS 排障

## 适用场景

- 用户提到 CentOS、CentOS Stream、RHEL 兼容系统中的服务启动失败、仓库异常、SELinux 拒绝或防火墙问题。
- 需要先做整机采样时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 若问题落在端口可达性、路由、DNS 或 TLS，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 核心约束

- 先区分 CentOS 7、CentOS Stream 8/9，再决定使用 `yum` 还是 `dnf`。
- SELinux 与 `firewalld` 默认视为正常安全边界；只能先取证，不能直接建议永久关闭。
- 仓库故障先验证 repo 配置、证书和 DNS，再考虑手工替换镜像。
- 修复服务前必须抓取 `systemctl status` 与 `journalctl -u` 的原始证据。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

cat /etc/os-release
rpm -qa | grep -E '^(centos|redhat|rocky|alma)'
systemctl --failed --no-pager
journalctl -b -p err..alert --no-pager | tail -n 80
```

```bash
#!/usr/bin/env bash
set -euo pipefail

service_name="nginx"
sudo systemctl status "$service_name" --no-pager
sudo journalctl -u "$service_name" -n 100 --no-pager
getenforce
sudo firewall-cmd --list-all
```

## 检查清单

- [ ] 确认发行版代际、内核版本与包管理器命令。
- [ ] 查看 `systemctl --failed`、目标服务状态与最近 100 行日志。
- [ ] 检查 `getenforce`、`ausearch -m AVC -ts recent` 或审计日志。
- [ ] 检查 `firewall-cmd --list-all`、监听端口与上游反代配置。
- [ ] 仓库问题先验证 `dnf repolist`、CA 证书与 DNS。
- [ ] 若涉及磁盘满或 inode 异常，切到 [disk-cleanup](../disk-cleanup/SKILL.md)。

## 反模式

- 不要把 `setenforce 0` 或 `systemctl stop firewalld` 当作默认修复。
- 不要在未核对发行版代际时混用 EL7/EL8/EL9 命令。
- 不要直接删除 `/var/lib/rpm`、`/var/cache/dnf` 之外的元数据目录。
- 不要跳过 `journalctl`，只凭一条启动报错下结论。
