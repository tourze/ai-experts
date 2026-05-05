import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const contextInjectorHook = defineHook({
  id: "context-injector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./context-injector.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
