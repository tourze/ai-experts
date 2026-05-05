import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
} from "../../sdk.js";

export const codingExpertPreCompactCompactionStrategyHook = defineHook({
  id: "coding-expert-pre-compact-compaction-strategy",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreCompact,
  entry: new URL("./module/pre-compact/compaction-strategy.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
