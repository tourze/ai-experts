import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const svnBulkOperationGuardHook = defineHook({
  id: "svn-bulk-operation-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-svn-bulk-operation-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
