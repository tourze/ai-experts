import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsDangerousInfraGuardHook = defineHook({
  id: "devops-dangerous-infra-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./devops-dangerous-infra-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
