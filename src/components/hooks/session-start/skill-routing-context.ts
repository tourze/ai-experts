import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { SESSION_START_ROUTING_CONTEXT } from "../_shared/skill-routing-rules.mjs";

export const skillRoutingContextHook = defineHook({
  id: "skill-routing-context",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./skill-routing-context.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

export async function run() {
  return {
    decision: "context",
    reason: SESSION_START_ROUTING_CONTEXT,
  };
}
