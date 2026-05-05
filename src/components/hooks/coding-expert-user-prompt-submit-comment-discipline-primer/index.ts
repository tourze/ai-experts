import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk.js";

export const codingExpertUserPromptSubmitCommentDisciplinePrimerHook = defineHook({
  id: "coding-expert-user-prompt-submit-comment-discipline-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/comment-discipline-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
