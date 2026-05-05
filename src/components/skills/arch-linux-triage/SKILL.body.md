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
