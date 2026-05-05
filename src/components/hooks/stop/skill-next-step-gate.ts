import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const skillNextStepGateHook = defineHook({
  id: "skill-next-step-gate",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./skill-next-step-gate.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
