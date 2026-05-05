import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const confusionProtocolHook = defineHook({
  id: "confusion-protocol",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./confusion-protocol.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
