import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpSymfonySyntaxDoctrineEntityHook = defineHook({
  id: "php-symfony-syntax-doctrine-entity",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-symfony-syntax-doctrine-entity.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
