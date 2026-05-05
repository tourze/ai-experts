import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const phpExpertPostToolUseEditWriteSyntaxComposerHook = defineHook({
  id: "php-expert-post-tool-use-edit-write-syntax-composer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./module/post-tool-use/edit-write/syntax-composer.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
