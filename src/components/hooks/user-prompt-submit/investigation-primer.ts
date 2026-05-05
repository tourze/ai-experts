import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const investigationPrimerHook = defineHook({
  id: "investigation-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./investigation-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
