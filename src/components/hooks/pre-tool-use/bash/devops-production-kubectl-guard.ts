import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsProductionKubectlGuardHook = defineHook({
  id: "devops-production-kubectl-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./devops-production-kubectl-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
