import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsLintTerraformFmtHook = defineHook({
  id: "devops-lint-terraform-fmt",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-lint-terraform-fmt.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
