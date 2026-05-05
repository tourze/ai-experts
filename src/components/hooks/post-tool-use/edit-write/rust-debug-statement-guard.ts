import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const rustDebugStatementGuardHook = defineHook({
  id: "rust-debug-statement-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./rust-debug-statement-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
