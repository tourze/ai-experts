import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const errorRetryGuardHook = defineHook({
  id: "error-retry-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./error-retry-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
