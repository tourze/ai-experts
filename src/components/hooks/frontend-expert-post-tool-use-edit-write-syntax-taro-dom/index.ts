import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk";

export const frontendExpertPostToolUseEditWriteSyntaxTaroDomHook = defineHook({
  id: "frontend-expert-post-tool-use-edit-write-syntax-taro-dom",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./module/post-tool-use/edit-write/syntax-taro-dom.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
