import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const typescriptExpertSessionStartNestjsEnvDetectorHook = defineHook({
  id: "typescript-expert-session-start-nestjs-env-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./module/session-start/nestjs-env-detector.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
