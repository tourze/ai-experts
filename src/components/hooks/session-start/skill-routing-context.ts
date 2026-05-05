import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { SESSION_START_ROUTING_CONTEXT } from "../_shared/skill-routing-rules.mjs";

export const skillRoutingContextHook = defineHook({
  id: "skill-routing-context",
  description: "注入 skill 路由规则上下文，辅助会话内 skill 自动匹配。",
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
