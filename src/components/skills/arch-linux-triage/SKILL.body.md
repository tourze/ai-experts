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
