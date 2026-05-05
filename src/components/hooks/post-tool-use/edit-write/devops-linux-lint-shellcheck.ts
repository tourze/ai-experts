import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsLinuxLintShellcheckHook = defineHook({
  id: "devops-linux-lint-shellcheck",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-linux-lint-shellcheck.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
