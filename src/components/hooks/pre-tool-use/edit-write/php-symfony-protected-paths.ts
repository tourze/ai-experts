import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpSymfonyProtectedPathsHook = defineHook({
  id: "php-symfony-protected-paths",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-symfony-protected-paths.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
