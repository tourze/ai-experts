import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const databaseRedisCliRiskGuardHook = defineHook({
  id: "database-redis-cli-risk-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./database-redis-cli-risk-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
