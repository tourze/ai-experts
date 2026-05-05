import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const securitySecretLeakGuardHook = defineHook({
  id: "security-secret-leak-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./security-secret-leak-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
