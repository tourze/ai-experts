import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const skillRoutingReminderHook = defineHook({
  id: "skill-routing-reminder",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./skill-routing-reminder.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
