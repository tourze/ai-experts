import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const frontendExpertUserPromptSubmitVisualBriefConcretizerPrimerHook = defineHook({
  id: "frontend-expert-user-prompt-submit-visual-brief-concretizer-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/visual-brief-concretizer-primer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
