import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const gitCommitMessageGuardHook = defineHook({
  id: "git-commit-message-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-commit-message-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
