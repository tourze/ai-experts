import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk.js";

export const skillExpertUserPromptSubmitTriggerTelemetryAdvisorReminderHook = defineHook({
  id: "skill-expert-user-prompt-submit-trigger-telemetry-advisor-reminder",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/trigger-telemetry-advisor-reminder.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
