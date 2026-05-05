import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const skillExpertUserPromptSubmitSkillRoutingReminderHook = defineHook({
  id: "skill-expert-user-prompt-submit-skill-routing-reminder",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/skill-routing-reminder.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
