import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const skillExpertStopNextStepGateHook = defineHook({
  id: "skill-expert-stop-next-step-gate",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./module/stop/next-step-gate.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
