import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpSymfonySyntaxTwigHook = defineHook({
  id: "php-symfony-syntax-twig",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-symfony-syntax-twig.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
