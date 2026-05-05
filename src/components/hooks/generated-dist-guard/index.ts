import {
  HookEvent,
  type NormalizedHookPayload,
  type NormalizedHookResult,
} from "../../sdk";

export async function run(payload: NormalizedHookPayload): Promise<NormalizedHookResult | null> {
  if (payload.event !== HookEvent.PostToolUse) return null;
  const targets = payload.tool?.fileTargets ?? [];
  const generatedTargets = targets.filter((target) =>
    target === "dist" || target.startsWith("dist/") || target.includes("/dist/"),
  );
  if (generatedTargets.length === 0) return null;

  return {
    kind: "report",
    message: [
      "Generated dist output was edited or touched.",
      "Update `src/components/` instead, then run `npm run build:components` to regenerate `dist/claude/` and `dist/codex/`.",
      `Generated target(s): ${generatedTargets.join(", ")}`,
    ].join("\n"),
  };
}
