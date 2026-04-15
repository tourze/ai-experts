---
name: arch-linux-triage
description: 当用户遇到 Arch Linux 的 pacman、systemd、滚动升级、AUR、内核或启动故障时使用。
---

# Arch Linux 排障

## 适用场景

- 用户提到 `pacman`、`mkinitcpio`、`systemd`、AUR、滚动升级后故障、启动失败或驱动回退。
- 需要先做基线采样时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 涉及 DNS、链路或端口不可达时，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 核心约束

- 严禁建议 `pacman -Sy` 单独刷新数据库；Arch 不允许 partial upgrade。
- 先采样再修复：优先保留 `journalctl`、`pacman.log`、`uname -a` 与失败服务状态。
- 涉及引导、initramfs、显卡驱动时，必须明确内核版本和最近一次升级时间。
- AUR 包与官方仓库问题分开处理，避免把第三方构建失败误判为系统损坏。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

printf '== release ==\n'
cat /etc/os-release
printf '\n== kernel ==\n'
uname -a
printf '\n== failed units ==\n'
systemctl --failed --no-pager
printf '\n== pacman tail ==\n'
tail -n 50 /var/log/pacman.log
```

```bash
#!/usr/bin/env bash
set -euo pipefail

package_name="linux"
sudo pacman -Qikk "$package_name"
sudo pacman -Syu
sudo mkinitcpio -P
sudo bootctl status
```

## 检查清单

- [ ] 确认 `cat /etc/os-release`、`uname -a`、`pacman -Q linux` 的输出一致。
- [ ] 查看 `systemctl --failed` 与 `journalctl -b -p err..alert --no-pager`。
- [ ] 检查 `/var/log/pacman.log` 中最近一次升级、回滚或镜像错误。
- [ ] 若涉及包损坏，先用 `pacman -Qikk <pkg>` 验证再决定重装。
- [ ] 若涉及引导，确认 `mkinitcpio -P`、`bootctl status` 或 GRUB 生成是否成功。
- [ ] 若涉及网络安装失败，切到 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 反模式

- 不要建议删除 `/var/lib/pacman/local` 或手工篡改 pacman 数据库。
- 不要在未确认镜像和 keyring 状态前直接归因于“系统损坏”。
- 不要把 `pacman -Sy <pkg>` 当作修复手段。
- 不要忽略 AUR helper 的 stderr；先区分 `makepkg` 失败还是仓库依赖失效。
