import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpHeavyCommandRepeatGuardHook = defineHook({
  id: "php-heavy-command-repeat-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./php-heavy-command-repeat-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
