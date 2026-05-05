import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const gitExpertPreToolUseBashGitCommitHeredocGuardHook = defineHook({
  id: "git-expert-pre-tool-use-bash-git-commit-heredoc-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./module/pre-tool-use/bash/git-commit-heredoc-guard.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
