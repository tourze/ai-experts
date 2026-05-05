import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const pythonLintRuffHook = defineHook({
  id: "python-lint-ruff",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./python-lint-ruff.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
