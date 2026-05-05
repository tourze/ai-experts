import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const devopsExpertPostToolUseEditWriteLinuxLintShellcheckHook = defineHook({
  id: "devops-expert-post-tool-use-edit-write-linux-lint-shellcheck",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./module/post-tool-use/edit-write/linux-lint-shellcheck.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
