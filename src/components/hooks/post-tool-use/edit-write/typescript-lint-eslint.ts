import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const typescriptLintEslintHook = defineHook({
  id: "typescript-lint-eslint",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./typescript-lint-eslint.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
