import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const devopsExpertPreToolUseBashDangerousInfraGuardHook = defineHook({
  id: "devops-expert-pre-tool-use-bash-dangerous-infra-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./module/pre-tool-use/bash/dangerous-infra-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
