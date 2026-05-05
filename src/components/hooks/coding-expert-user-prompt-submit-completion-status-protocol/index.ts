import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const codingExpertUserPromptSubmitCompletionStatusProtocolHook = defineHook({
  id: "coding-expert-user-prompt-submit-completion-status-protocol",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./module/user-prompt-submit/completion-status-protocol.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
