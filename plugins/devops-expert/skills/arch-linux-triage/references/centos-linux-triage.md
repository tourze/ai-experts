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

### FAIL: setenforce 0 当修复

```bash
"服务起不来" → sudo setenforce 0
"看，好了！" → 问题"消失"
→ 真问题：SELinux 拒绝访问某文件 → 修了表面，留下安全漏洞
```

### PASS: 取证 + 写策略

```bash
sudo ausearch -m AVC -ts recent  # 看具体拒绝
# audit2allow -M mypolicy < ...  # 生成精确策略
sudo semodule -i mypolicy.pp     # 仅放行需要的
# 永远保持 SELinux enforcing
```

### FAIL: EL7/8/9 命令混用

```
CentOS 7 系统：
sudo dnf install foo  # 7 没有 dnf，应该用 yum
sudo systemctl stop firewalld  # 7 用 iptables
```

### PASS: 先确认代际

```bash
cat /etc/os-release  # 看 VERSION_ID
# EL7 → yum / iptables
# EL8/9 → dnf / firewalld / nftables
```