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
