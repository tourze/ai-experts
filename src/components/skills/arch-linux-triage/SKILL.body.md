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

### FAIL: pacman -Sy 单独刷新

```bash
sudo pacman -Sy openssl  # 仅刷新数据库 + 装单包
# Arch partial upgrade → 系统不一致 → 各种动态库符号错位
```

### PASS: 必须 -Syu 完整升级

```bash
sudo pacman -Syu  # 同步数据库 + 全量升级
# 永远不要 -Sy 而不 -Syu
```

### FAIL: 删 pacman 数据库

```bash
“无法解决依赖” → sudo rm -rf /var/lib/pacman/local
→ 包数据库丢失 / 无法重建 / 系统崩
```

### PASS: 用 -Qikk 验证

```bash
sudo pacman -Qikk linux  # 检查文件完整性
# 损坏才考虑重装单包：sudo pacman -S linux
```
