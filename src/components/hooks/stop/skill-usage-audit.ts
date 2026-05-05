import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const skillUsageAuditHook = defineHook({
  id: "skill-usage-audit",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./skill-usage-audit.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
