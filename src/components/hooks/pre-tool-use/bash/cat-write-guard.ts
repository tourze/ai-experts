import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const catWriteGuardHook = defineHook({
  id: "cat-write-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./cat-write-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
