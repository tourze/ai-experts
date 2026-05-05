import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const frontendSyntaxTaroDomHook = defineHook({
  id: "frontend-syntax-taro-dom",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./frontend-syntax-taro-dom.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
