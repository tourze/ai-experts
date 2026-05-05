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
