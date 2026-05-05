import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsSyntaxDockerfileHook = defineHook({
  id: "devops-syntax-dockerfile",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-syntax-dockerfile.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
