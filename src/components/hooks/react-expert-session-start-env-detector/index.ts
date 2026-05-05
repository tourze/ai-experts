import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const reactExpertSessionStartEnvDetectorHook = defineHook({
  id: "react-expert-session-start-env-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./module/session-start/env-detector.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
