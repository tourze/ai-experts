import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const skillExpertStopSkillUsageAuditHook = defineHook({
  id: "skill-expert-stop-skill-usage-audit",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./module/stop/skill-usage-audit.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
