#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
collect_stacks.sh --pid <pid> [--out <prefix>] [--repeat <n>] [--sleep <seconds>]
collect_stacks.sh --name <process-substring> [--out <prefix>] [--repeat <n>] [--sleep <seconds>]

Examples:
  collect_stacks.sh --pid 12345 --out /tmp/hang --repeat 3 --sleep 0.5
  collect_stacks.sh --name "my-app" --out /tmp/hang
USAGE
}

die() {
  echo "$*" >&2
  usage >&2
  exit 1
}

require_value() {
  local flag="$1"
  local value="${2-}"
  if [[ -z "$value" || "$value" == --* ]]; then
    die "Missing value for ${flag}."
  fi
}

pid=""
name=""
out="stack"
repeat=1
sleep_s=0.5

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pid)
      require_value "$1" "${2-}"
      pid="$2"; shift 2;;
    --name)
      require_value "$1" "${2-}"
      name="$2"; shift 2;;
    --out)
      require_value "$1" "${2-}"
      out="$2"; shift 2;;
    --repeat)
      require_value "$1" "${2-}"
      repeat="$2"; shift 2;;
    --sleep)
      require_value "$1" "${2-}"
      sleep_s="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      die "Unknown arg: $1";;
  esac
done

if [[ -n "$pid" && ! "$pid" =~ ^[1-9][0-9]*$ ]]; then
  die "--pid must be a positive integer."
fi

if [[ "$repeat" =~ ^0*[0-9]+$ ]] && (( repeat >= 1 )); then
  :
else
  die "--repeat must be an integer greater than or equal to 1."
fi

if [[ "$sleep_s" =~ ^([0-9]+([.][0-9]+)?|[.][0-9]+)$ ]]; then
  :
else
  die "--sleep must be a non-negative number."
fi

if [[ -z "$pid" ]]; then
  if [[ -n "$name" ]]; then
    if command -v pgrep >/dev/null 2>&1; then
      pid="$(pgrep -n -f "$name" || true)"
    fi
  fi
fi

if [[ -z "$pid" ]]; then
  die "Missing --pid (or --name did not match any process)."
fi

if command -v lldb >/dev/null 2>&1; then
  debugger="lldb"
  run_debugger() {
    lldb -p "$pid" -o 'thread backtrace all' -o 'detach' -o 'quit'
  }
elif command -v gdb >/dev/null 2>&1; then
  debugger="gdb"
  run_debugger() {
    gdb -q -p "$pid" -ex "thread apply all bt" -ex "detach" -ex "quit"
  }
else
  echo "No lldb or gdb found in PATH." >&2
  exit 2
fi

stamp="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$(dirname "$out")"
for ((i = 1; i <= repeat; i += 1)); do
  file="${out}_${pid}_${stamp}_${i}.txt"
  echo "[$debugger] pid=$pid -> $file"
  run_debugger > "$file" 2>&1 || true
  if (( i < repeat )); then
    sleep "$sleep_s"
  fi
done
