import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const gitCommitHeredocGuardHook = defineHook({
  id: "git-commit-heredoc-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-commit-heredoc-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
