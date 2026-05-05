import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const codingExpertPreToolUseBashSedInplaceGuardHook = defineHook({
  id: "coding-expert-pre-tool-use-bash-sed-inplace-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./module/pre-tool-use/bash/sed-inplace-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
