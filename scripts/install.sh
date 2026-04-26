#!/usr/bin/env bash
# ai-experts installer (post-marketplace).
#
# 不再使用 Claude Code / Codex 的 marketplace + plugin install 体系，
# 而是直接：
#   - 把每个 plugins/<plugin>/skills/<id> 软链到 ~/.claude/skills/<id>
#     与 ~/.codex/skills/<id>
#   - 把每个 plugins/<plugin>/agents/<name>.md 软链到 ~/.claude/agents/<name>.md
#   - 把统一 dispatcher 写进 ~/.claude/settings.json 与 ~/.codex/hooks.json
#   - 在 ~/.codex/config.toml 启用 [features] codex_hooks = true
#   - 把仓库 MEMORY.md 软链到各 CLI 的全局记忆文件
#
# 用法：
#   ./scripts/install.sh              # 全部安装
#   ./scripts/install.sh --uninstall  # 全部卸载
#   ./scripts/install.sh --reinstall  # 卸载后再装
#   ./scripts/install.sh --dry-run    # 仅打印，不改动

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
MARKETPLACE_NAME="ai-experts"
MEMORY_SOURCE="$REPO_ROOT/MEMORY.md"
CLAUDE_MEMORY_TARGET="${CLAUDE_MEMORY_TARGET:-$HOME/.claude/CLAUDE.md}"
CODEX_MEMORY_TARGET="${CODEX_MEMORY_TARGET:-${CODEX_HOME_DIR}/AGENTS.md}"

# ── helpers ──────────────────────────────────────────────────

has_cmd() { command -v "$1" &>/dev/null; }

info()  { printf '\033[1;34m[info]\033[0m  %s\n' "$1"; }
ok()    { printf '\033[1;32m[ok]\033[0m    %s\n' "$1"; }
warn()  { printf '\033[1;33m[warn]\033[0m  %s\n' "$1"; }
err()   { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; }

DRY_RUN=""

# ── memory file 软链 ─────────────────────────────────────────

backup_existing_file() {
  local target="$1"
  local backup="${target}.bak.$(date +%Y%m%d%H%M%S)"
  mv "$target" "$backup"
  warn "Backed up existing memory file: $target -> $backup"
}

link_memory_file() {
  local label="$1"
  local target="$2"

  if [ ! -f "$MEMORY_SOURCE" ]; then
    err "Shared memory source not found: $MEMORY_SOURCE"
    return 1
  fi

  if [ -d "$target" ] && [ ! -L "$target" ]; then
    err "$label: memory target is a directory, cannot link: $target"
    return 1
  fi

  if [ -e "$target" ] && [ "$target" -ef "$MEMORY_SOURCE" ]; then
    ok "$label: memory already linked ($target)"
    return 0
  fi

  if [ -n "$DRY_RUN" ]; then
    info "$label: would link $target → $MEMORY_SOURCE"
    return 0
  fi

  mkdir -p "$(dirname "$target")"
  if [ -e "$target" ] || [ -L "$target" ]; then
    backup_existing_file "$target"
  fi
  ln -s "$MEMORY_SOURCE" "$target"
  ok "$label: linked memory $target → $MEMORY_SOURCE"
}

unlink_memory_file() {
  local label="$1"
  local target="$2"
  if [ -L "$target" ] && [ -e "$target" ] && [ "$target" -ef "$MEMORY_SOURCE" ]; then
    if [ -n "$DRY_RUN" ]; then
      info "$label: would unlink $target"
      return 0
    fi
    rm -f "$target"
    ok "$label: removed memory link ($target)"
    return 0
  fi
  info "$label: leaving memory target unchanged ($target)"
}

# ── 子脚本调用 ───────────────────────────────────────────────

run_node() {
  local script="$1"; shift
  local args=()
  if [ -n "$DRY_RUN" ]; then args+=("--dry-run"); fi
  args+=("$@")
  node "$REPO_ROOT/scripts/$script" "${args[@]}"
}

audit_skill_evals() {
  if [ -f "$REPO_ROOT/scripts/audit-skill-evals.mjs" ]; then
    node "$REPO_ROOT/scripts/audit-skill-evals.mjs" || true
  fi
}

# ── 旧版残留清理（向后兼容） ─────────────────────────────────

claude_legacy_cleanup() {
  has_cmd claude || return 0
  info "Claude Code: 清理旧版 marketplace 残留（best-effort）..."

  claude plugin list --json 2>/dev/null \
    | node -e '
const marketplaceName = process.argv[1];
const suffix = `@${marketplaceName}`;
let raw = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  let plugins;
  try { plugins = JSON.parse(raw || "[]"); } catch { process.exit(0); }
  for (const p of Array.isArray(plugins) ? plugins : []) {
    if (p?.scope !== "user") continue;
    if (typeof p?.id !== "string" || !p.id.endsWith(suffix)) continue;
    console.log(p.id.slice(0, -suffix.length));
  }
});
' "$MARKETPLACE_NAME" 2>/dev/null \
    | while read -r name; do
        [ -n "$name" ] || continue
        if [ -n "$DRY_RUN" ]; then
          info "  would: claude plugin uninstall $name"
        else
          claude plugin uninstall "$name" 2>/dev/null || true
        fi
      done

  if [ -z "$DRY_RUN" ]; then
    claude plugin marketplace remove "$MARKETPLACE_NAME" 2>/dev/null || true
  else
    info "  would: claude plugin marketplace remove $MARKETPLACE_NAME"
  fi
}

# ── Claude Code ──────────────────────────────────────────────

claude_install() {
  info "Claude Code: 同步 skills..."
  run_node sync-skills.mjs --target=cc

  info "Claude Code: 同步 agents..."
  run_node sync-agents.mjs

  info "Claude Code: 注册统一 hooks..."
  run_node sync-hooks.mjs --target=cc

  info "Claude Code: 链接共享记忆..."
  link_memory_file "Claude Code" "$CLAUDE_MEMORY_TARGET"

  ok "Claude Code: done."
}

claude_uninstall() {
  info "Claude Code: 解链 skills..."
  run_node sync-skills.mjs --target=cc --uninstall

  info "Claude Code: 解链 agents..."
  run_node sync-agents.mjs --uninstall

  info "Claude Code: 移除统一 hooks 条目..."
  run_node sync-hooks.mjs --target=cc --uninstall

  info "Claude Code: 移除共享记忆链接..."
  unlink_memory_file "Claude Code" "$CLAUDE_MEMORY_TARGET"

  claude_legacy_cleanup

  ok "Claude Code: uninstalled."
}

# ── Codex CLI ────────────────────────────────────────────────

codex_install() {
  info "Codex CLI: 启用 codex_hooks feature flag..."
  if has_cmd codex; then
    if [ -n "$DRY_RUN" ]; then
      info "  would: codex features enable codex_hooks"
    else
      codex features enable codex_hooks 2>/dev/null || true
    fi
  fi

  info "Codex CLI: 同步 skills..."
  run_node sync-skills.mjs --target=codex

  info "Codex CLI: 注册统一 hooks..."
  run_node sync-hooks.mjs --target=codex

  info "Codex CLI: 链接共享记忆..."
  link_memory_file "Codex CLI" "$CODEX_MEMORY_TARGET"

  ok "Codex CLI: done. 重启 codex 生效。"
}

codex_uninstall() {
  info "Codex CLI: 解链 skills..."
  run_node sync-skills.mjs --target=codex --uninstall

  info "Codex CLI: 移除统一 hooks 条目并清理旧 marketplace 段..."
  run_node sync-hooks.mjs --target=codex --uninstall

  info "Codex CLI: 清理 ai-experts plugin cache..."
  if [ -n "$DRY_RUN" ]; then
    info "  would: rm -rf ${CODEX_HOME_DIR}/plugins/cache/${MARKETPLACE_NAME}"
  else
    rm -rf "${CODEX_HOME_DIR}/plugins/cache/${MARKETPLACE_NAME}"
  fi

  info "Codex CLI: 移除共享记忆链接..."
  unlink_memory_file "Codex CLI" "$CODEX_MEMORY_TARGET"

  ok "Codex CLI: uninstalled."
}

# ── main ─────────────────────────────────────────────────────

ACTION="install"
for arg in "$@"; do
  case "$arg" in
    --uninstall|-u)   ACTION="uninstall" ;;
    --reinstall|-r)   ACTION="reinstall" ;;
    install|--install|-i) ACTION="install" ;;
    --dry-run)        DRY_RUN="1" ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--install | --uninstall | --reinstall] [--dry-run]
EOF
      exit 0
      ;;
    "") ;;
    *)
      err "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

case "$ACTION" in
  uninstall)
    has_cmd claude && claude_uninstall || true
    has_cmd codex  && codex_uninstall  || true
    ;;
  reinstall)
    has_cmd claude && claude_uninstall || true
    has_cmd codex  && codex_uninstall  || true
    echo ""
    if has_cmd claude || has_cmd codex; then
      audit_skill_evals
    fi
    has_cmd claude && claude_install || true
    has_cmd codex  && codex_install  || true
    ;;
  install)
    if ! has_cmd claude && ! has_cmd codex; then
      err "未检测到 'claude' 或 'codex' CLI。请至少安装其中一个："
      err "  Claude Code: https://code.claude.com"
      err "  Codex CLI:   https://github.com/openai/codex"
      exit 1
    fi
    audit_skill_evals
    has_cmd claude && claude_install || true
    has_cmd codex  && codex_install  || true
    ;;
esac
