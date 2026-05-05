import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const phpTestOutputTruncationGuardHook = defineHook({
  id: "php-test-output-truncation-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./php-test-output-truncation-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
