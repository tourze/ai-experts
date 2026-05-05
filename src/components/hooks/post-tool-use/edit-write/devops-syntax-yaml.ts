import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsSyntaxYamlHook = defineHook({
  id: "devops-syntax-yaml",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-syntax-yaml.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
