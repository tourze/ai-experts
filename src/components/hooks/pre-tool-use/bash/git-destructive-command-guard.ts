import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const gitDestructiveCommandGuardHook = defineHook({
  id: "git-destructive-command-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-destructive-command-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
