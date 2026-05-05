import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const largeEditChunkGuardHook = defineHook({
  id: "large-edit-chunk-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./large-edit-chunk-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
