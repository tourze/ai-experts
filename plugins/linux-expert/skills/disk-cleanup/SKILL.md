---
name: disk-cleanup
description: 当用户说磁盘满了、空间不足、inode 用尽、要清缓存或定位大文件时使用。
---

# 磁盘清理

## 适用场景

- 用户反馈磁盘占满、构建失败提示 `No space left on device`、系统日志写不进或 inode 用尽。
- 需要先确认整体资源状态时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 若目标是释放空间后继续提速，可与 [performance-optimizer](../performance-optimizer/SKILL.md) 联动。

## 核心约束

- 所有删除动作都先量化收益，再展示候选路径，再等用户确认。
- 先清理缓存、日志、临时文件，再碰下载目录、容器卷或业务数据。
- 必须区分“块空间不足”和“inode 耗尽”，两者处置不同。
- 不能建议删除用户项目目录、数据库文件或未知挂载点中的数据。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

df -hT
df -ih
sudo du -xhd1 /var 2>/dev/null | sort -h
sudo find /var/log -type f -size +100M -printf '%s %p\n' | sort -nr | head -20
```

```bash
#!/usr/bin/env bash
set -euo pipefail

sudo journalctl --disk-usage
sudo apt-get clean 2>/dev/null || true
sudo dnf clean all 2>/dev/null || true
sudo pacman -Sc --noconfirm 2>/dev/null || true
docker system df 2>/dev/null || true
```

## 检查清单

- [ ] 记录 `df -hT`、`df -ih`，确认是空间还是 inode 先耗尽。
- [ ] 量化 `/var/log`、包管理缓存、容器层、构建缓存、临时目录大小。
- [ ] 若有 Docker/Podman，检查 `docker system df` 或 `podman system df`。
- [ ] 清理前先列出具体删除对象与预估回收空间。
- [ ] 删除后重新执行 `df -hT` 与关键业务验证。
- [ ] 若根因是日志暴涨或进程泄漏，切到 [performance-optimizer](../performance-optimizer/SKILL.md)。

## 反模式

- 不要一上来执行 `rm -rf /tmp/*`、`docker system prune -a` 或清空下载目录。
- 不要删除未知卷、数据库目录、`/var/lib` 下的业务数据。
- 不要忽略 inode；`df -h` 正常不代表文件数没耗尽。
- 不要在没有前后对比的情况下宣称“已经清理干净”。
