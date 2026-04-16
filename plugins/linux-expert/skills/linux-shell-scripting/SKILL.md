---
name: linux-shell-scripting
description: 当用户要编写 Bash/Zsh 自动化、运维脚本、巡检脚本、备份脚本或命令行工具时使用。
---

# Linux Shell 脚本

## 适用场景

- 用户要写 Bash 自动化、巡检、备份、发布、清理、定时任务或包装 CLI。
- 需要系统快照与诊断输出模板时，可参考 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 涉及网络探测或重试逻辑时，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 核心约束

- 默认使用 `#!/usr/bin/env bash` 与 `set -euo pipefail`；仅在明确需要 POSIX `sh` 时降级。
- 任何删除、覆盖、远程执行动作都必须先校验参数并输出计划。
- 禁止把秘密硬编码进脚本；用环境变量、参数或凭据文件。
- 产出的脚本必须具备 `usage`、依赖检查、日志函数和失败返回码。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <source_dir> <target_dir>" >&2
  exit 64
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing command: $1" >&2
    exit 69
  }
}

[[ $# -eq 2 ]] || usage
require_cmd rsync

source_dir="$1"
target_dir="$2"
timestamp="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$target_dir"
rsync -a --delete "$source_dir"/ "$target_dir"/current/
tar -C "$target_dir" -czf "$target_dir/backup_$timestamp.tar.gz" current
```

```bash
#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

cleanup() {
  rm -f "${tmp_file:-}"
}

trap cleanup EXIT
tmp_file="$(mktemp)"
log "collecting snapshot"
df -h >"$tmp_file"
cat "$tmp_file"
```

## 检查清单

- [ ] shebang、`set -euo pipefail`、参数校验、依赖校验齐全。
- [ ] 所有变量都被双引号包裹，路径与空格安全。
- [ ] 使用 `trap` 处理临时文件、锁文件或后台进程清理。
- [ ] 失败时返回非零 exit code，成功路径可复验。
- [ ] 长循环、网络重试、并发任务包含超时与限次控制。
- [ ] 若脚本负责清理空间，联动 [disk-cleanup](../disk-cleanup/SKILL.md)。

## 反模式

### FAIL: 缺 set 严格模式

```bash
#!/bin/bash
cd /tmp/build  # 失败也继续
rm -rf $output  # output 未定义 → rm -rf /
```

### PASS: 严格模式 + 引号

```bash
#!/usr/bin/env bash
set -euo pipefail
cd “/tmp/build” || exit 1
rm -rf “${output:?output not set}”
```

### FAIL: for f in $(ls ...)

```bash
for f in $(ls *.txt); do
  cat $f  # 文件名带空格 → 拆词错乱
done
```

### PASS: glob + 引号

```bash
shopt -s nullglob
for f in *.txt; do
  cat “$f”
done
```

### FAIL: 破坏命令无 dry-run

```bash
sync_users() {
  rm -rf /home/$u  # 同步前没预览
}
```

### PASS: --dry-run 默认

```bash
sync_users() {
  local dry=”${DRY_RUN:-1}”
  for u in “$@”; do
    if [[ “$dry” == “1” ]]; then
      echo “[dry-run] would remove /home/$u”
    else
      rm -rf “/home/$u”
    fi
  done
}
```
