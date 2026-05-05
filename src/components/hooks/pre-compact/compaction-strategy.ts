import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const compactionStrategyHook = defineHook({
  id: "compaction-strategy",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreCompact,
  entry: new URL("./compaction-strategy.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
