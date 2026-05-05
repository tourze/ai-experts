import { SESSION_START_ROUTING_CONTEXT } from "../_shared/skill-routing-rules.mjs";

export async function run() {
  return {
    decision: "context",
    reason: SESSION_START_ROUTING_CONTEXT,
  };
}
