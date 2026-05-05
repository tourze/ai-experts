import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const feedbackDetectorHook = defineHook({
  id: "feedback-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./feedback-detector.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
