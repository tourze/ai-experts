import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const commentDisciplinePrimerHook = defineHook({
  id: "comment-discipline-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./comment-discipline-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
