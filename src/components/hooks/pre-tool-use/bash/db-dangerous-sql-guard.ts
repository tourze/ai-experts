import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const dbDangerousSqlGuardHook = defineHook({
  id: "db-dangerous-sql-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./db-dangerous-sql-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
