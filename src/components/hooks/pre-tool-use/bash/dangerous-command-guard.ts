import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const dangerousCommandGuardHook = defineHook({
  id: "dangerous-command-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./dangerous-command-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
