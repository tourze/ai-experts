#!/usr/bin/env bash
# ai-experts installer
#
# Detects installed CLI tools (Claude Code / Codex CLI) and sets up
# marketplace + plugins for each one. Also links shared global memory.
#
# Usage:
#   ./scripts/install.sh              # install for all detected CLIs
#   ./scripts/install.sh --uninstall  # remove everything
#   ./scripts/install.sh --reinstall  # uninstall then install

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
CODEX_CONFIG="${CODEX_HOME_DIR}/config.toml"
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

plugin_names() {
  node -e '
const { readFileSync } = require("node:fs");

const manifest = JSON.parse(readFileSync(process.argv[1], "utf-8"));
for (const plugin of manifest.plugins ?? []) {
  if (typeof plugin.name === "string" && plugin.name.length > 0) {
    console.log(plugin.name);
  }
}
' "$1"
}

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

  mkdir -p "$(dirname "$target")"

  if [ -e "$target" ] && [ "$target" -ef "$MEMORY_SOURCE" ]; then
    ok "$label: shared memory already linked ($target)"
    return 0
  fi

  if [ -e "$target" ] || [ -L "$target" ]; then
    backup_existing_file "$target"
  fi

  ln -s "$MEMORY_SOURCE" "$target"
  ok "$label: linked shared memory to $target"
}

unlink_memory_file() {
  local label="$1"
  local target="$2"

  if [ -L "$target" ] && [ -e "$target" ] && [ "$target" -ef "$MEMORY_SOURCE" ]; then
    rm -f "$target"
    ok "$label: removed shared memory link ($target)"
    return 0
  fi

  info "$label: leaving memory target unchanged ($target)"
}

# ── Claude Code ──────────────────────────────────────────────

claude_install() {
  info "Claude Code: registering marketplace..."
  claude plugin marketplace add "$REPO_ROOT" --scope user 2>/dev/null || true

  info "Claude Code: installing all plugins..."
  local manifest="$REPO_ROOT/.claude-plugin/marketplace.json"
  plugin_names "$manifest" | while read -r name; do
    claude plugin install "${name}@${MARKETPLACE_NAME}" 2>/dev/null || true
  done

  info "Claude Code: linking shared global memory..."
  link_memory_file "Claude Code" "$CLAUDE_MEMORY_TARGET"

  ok "Claude Code: done. Run /reload-plugins in Claude Code to activate."
}

claude_uninstall() {
  info "Claude Code: uninstalling all plugins..."
  claude plugin list --json 2>/dev/null \
    | node -e '
const marketplaceName = process.argv[1];
const suffix = `@${marketplaceName}`;
let raw = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  let plugins;
  try {
    plugins = JSON.parse(raw || "[]");
  } catch {
    process.exit(0);
  }

  for (const plugin of Array.isArray(plugins) ? plugins : []) {
    if (plugin?.scope !== "user") continue;
    if (typeof plugin?.id !== "string" || !plugin.id.endsWith(suffix)) continue;
    console.log(plugin.id.slice(0, -suffix.length));
  }
});
' "$MARKETPLACE_NAME" \
    | while read -r name; do
        claude plugin uninstall "$name" 2>/dev/null || true
      done

  info "Claude Code: removing marketplace..."
  claude plugin marketplace remove "$MARKETPLACE_NAME" 2>/dev/null || true

  info "Claude Code: removing shared global memory link..."
  unlink_memory_file "Claude Code" "$CLAUDE_MEMORY_TARGET"

  ok "Claude Code: uninstalled."
}

# ── Codex CLI ────────────────────────────────────────────────

codex_install() {
  info "Codex CLI: enabling codex_hooks feature flag..."
  codex features enable codex_hooks 2>/dev/null || true

  info "Codex CLI: generating user-level hooks.json..."
  node "$REPO_ROOT/scripts/generate-codex-hooks.mjs" --write --user

  info "Codex CLI: registering marketplace..."
  codex marketplace add "$REPO_ROOT" 2>/dev/null || true

  info "Codex CLI: enabling all plugins in config.toml..."
  local manifest="$REPO_ROOT/.agents/plugins/marketplace.json"

  # Remove any existing ai-experts plugin entries first to avoid duplicates
  codex_remove_plugin_entries

  # Append plugin entries
  plugin_names "$manifest" | while read -r name; do
    printf '\n[plugins."%s@%s"]\nenabled = true\n' "$name" "$MARKETPLACE_NAME" >> "$CODEX_CONFIG"
  done

  info "Codex CLI: linking shared global memory..."
  link_memory_file "Codex CLI" "$CODEX_MEMORY_TARGET"

  ok "Codex CLI: done. Restart codex to activate."
}

codex_uninstall() {
  info "Codex CLI: removing user-level hooks.json..."
  rm -f "${CODEX_HOME_DIR}/hooks.json"

  info "Codex CLI: removing marketplace..."
  # codex has no stable marketplace remove command in all versions.
  # Remove marketplace/plugins directly from config.toml.
  codex_remove_marketplace_entry
  codex_remove_plugin_entries

  info "Codex CLI: removing shared global memory link..."
  unlink_memory_file "Codex CLI" "$CODEX_MEMORY_TARGET"

  ok "Codex CLI: uninstalled."
}

codex_remove_plugin_entries() {
  [ -f "$CODEX_CONFIG" ] || return 0

  # Remove all [plugins."*@ai-experts"] sections from config.toml
  # A section starts with [plugins."...@ai-experts"] and ends at the next section or EOF
  local tmp
  tmp="$(mktemp)"
  awk '
    /^\[plugins\."[^"]*@ai-experts"\]/ { skip=1; next }
    /^\[/                               { skip=0 }
    !skip                               { print }
  ' "$CODEX_CONFIG" > "$tmp"

  # Remove trailing blank lines that were left behind
  sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$tmp" > "$CODEX_CONFIG"
  rm -f "$tmp"
}

codex_remove_marketplace_entry() {
  [ -f "$CODEX_CONFIG" ] || return 0

  local tmp
  tmp="$(mktemp)"
  awk '
    /^\[marketplaces\.ai-experts\]/ { skip=1; next }
    /^\[/                           { skip=0 }
    !skip                           { print }
  ' "$CODEX_CONFIG" > "$tmp"

  sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$tmp" > "$CODEX_CONFIG"
  rm -f "$tmp"
}

# ── main ─────────────────────────────────────────────────────

action="${1:-install}"

case "$action" in
  --uninstall|-u)
    has_cmd claude && claude_uninstall
    has_cmd codex  && codex_uninstall
    ;;
  --reinstall|-r)
    has_cmd claude && claude_uninstall
    has_cmd codex  && codex_uninstall
    echo ""
    has_cmd claude && claude_install
    has_cmd codex  && codex_install
    ;;
  install|--install|-i|"")
    has_cmd claude && claude_install
    has_cmd codex  && codex_install

    if ! has_cmd claude && ! has_cmd codex; then
      err "Neither 'claude' nor 'codex' CLI found. Install at least one:"
      err "  Claude Code: https://code.claude.com"
      err "  Codex CLI:   https://github.com/openai/codex"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [--install | --uninstall | --reinstall]"
    exit 1
    ;;
esac
