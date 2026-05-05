import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const docsVisualStructurePrimerHook = defineHook({
  id: "docs-visual-structure-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./docs-visual-structure-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
