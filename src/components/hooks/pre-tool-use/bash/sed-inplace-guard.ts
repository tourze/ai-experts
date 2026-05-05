import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const sedInplaceGuardHook = defineHook({
  id: "sed-inplace-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./sed-inplace-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
