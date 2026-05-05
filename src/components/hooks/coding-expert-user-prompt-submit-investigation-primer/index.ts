import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk.js";

export const codingExpertUserPromptSubmitInvestigationPrimerHook = defineHook({
  id: "coding-expert-user-prompt-submit-investigation-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/investigation-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
