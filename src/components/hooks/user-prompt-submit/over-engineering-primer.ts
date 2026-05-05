import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const overEngineeringPrimerHook = defineHook({
  id: "over-engineering-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./over-engineering-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
