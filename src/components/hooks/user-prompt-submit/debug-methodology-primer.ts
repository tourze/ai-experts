import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const debugMethodologyPrimerHook = defineHook({
  id: "debug-methodology-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./debug-methodology-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
