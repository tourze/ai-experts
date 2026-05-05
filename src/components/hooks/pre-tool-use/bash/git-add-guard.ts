import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const gitAddGuardHook = defineHook({
  id: "git-add-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-add-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
