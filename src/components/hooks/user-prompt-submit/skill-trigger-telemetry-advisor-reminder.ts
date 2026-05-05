import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const skillTriggerTelemetryAdvisorReminderHook = defineHook({
  id: "skill-trigger-telemetry-advisor-reminder",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./skill-trigger-telemetry-advisor-reminder.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
