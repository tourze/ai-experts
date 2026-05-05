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
