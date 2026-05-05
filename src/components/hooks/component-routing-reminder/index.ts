import {
  HookEvent,
  type NormalizedHookPayload,
  type NormalizedHookResult,
} from "../../sdk.js";

const ROUTING_TERMS = /skill|skills|agent|agents|hook|hooks|CLAUDE\.md|AGENTS\.md|dist\/claude|dist\/codex|组件|技能|代理|钩子|指令/u;

export async function run(payload: NormalizedHookPayload): Promise<NormalizedHookResult | null> {
  if (payload.event !== HookEvent.UserPromptSubmit) return null;
  const prompt = payload.prompt ?? "";
  if (!ROUTING_TERMS.test(prompt)) return null;

  return {
    kind: "add-context",
    message: [
      "ai-experts component routing reminder:",
      "- Use `src/components/` as the source of truth.",
      "- Manage Instructions, Skills, Agents, Hooks, and Profiles as registered TS components.",
      "- Treat `dist/claude/` and `dist/codex/` as generated output.",
      "- Do not create any separate compatibility layer for new design work.",
    ].join("\n"),
  };
}
