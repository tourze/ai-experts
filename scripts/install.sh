#!/usr/bin/env bash
# ai-experts installer
#
# Detects installed CLI tools (Claude Code / Codex CLI) and sets up
# marketplace + plugins for each one.
#
# Usage:
#   ./scripts/install.sh              # install for all detected CLIs
#   ./scripts/install.sh --uninstall  # remove everything
#   ./scripts/install.sh --reinstall  # uninstall then install

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_CONFIG="${CODEX_HOME:-$HOME/.codex}/config.toml"
MARKETPLACE_NAME="ai-experts"

# ── helpers ──────────────────────────────────────────────────

has_cmd() { command -v "$1" &>/dev/null; }

info()  { printf '\033[1;34m[info]\033[0m  %s\n' "$1"; }
ok()    { printf '\033[1;32m[ok]\033[0m    %s\n' "$1"; }
warn()  { printf '\033[1;33m[warn]\033[0m  %s\n' "$1"; }
err()   { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; }

plugin_names() {
  jq -r '.plugins[].name' "$1"
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

  ok "Claude Code: done. Run /reload-plugins in Claude Code to activate."
}

claude_uninstall() {
  info "Claude Code: uninstalling all plugins..."
  claude plugin list --json 2>/dev/null \
    | jq -r ".[] | select(.id | endswith(\"@${MARKETPLACE_NAME}\")) | select(.scope == \"user\") | .id | split(\"@\")[0]" \
    | while read -r name; do
        claude plugin uninstall "$name" 2>/dev/null || true
      done

  info "Claude Code: removing marketplace..."
  claude plugin marketplace remove "$MARKETPLACE_NAME" 2>/dev/null || true

  ok "Claude Code: uninstalled."
}

# ── Codex CLI ────────────────────────────────────────────────

codex_install() {
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

  ok "Codex CLI: done. Restart codex to activate."
}

codex_uninstall() {
  info "Codex CLI: removing marketplace..."
  codex marketplace add "$REPO_ROOT" 2>/dev/null  # ensure it exists before removing
  # codex has no marketplace remove command via CLI in some versions, try both
  # The marketplace entry in config.toml is under [marketplaces.<name>]
  codex_remove_marketplace_entry
  codex_remove_plugin_entries

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
