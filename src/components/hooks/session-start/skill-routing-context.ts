import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const skillRoutingContextHook = defineHook({
  id: "skill-routing-context",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./skill-routing-context.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
