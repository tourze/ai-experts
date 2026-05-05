import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const completionStatusProtocolHook = defineHook({
  id: "completion-status-protocol",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./completion-status-protocol.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
