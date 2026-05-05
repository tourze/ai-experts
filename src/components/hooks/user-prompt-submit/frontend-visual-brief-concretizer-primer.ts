import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const frontendVisualBriefConcretizerPrimerHook = defineHook({
  id: "frontend-visual-brief-concretizer-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./frontend-visual-brief-concretizer-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
