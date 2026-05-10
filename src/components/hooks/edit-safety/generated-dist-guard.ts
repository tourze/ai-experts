import {
  defineHook,
  HookEvent,
  KnownTool,
  Platform,
  type NormalizedHookPayload,
  type NormalizedHookResult,
} from "../../sdk";

export const generatedDistGuard = defineHook({
  id: "generated-dist-guard",
  description: "阻断对 dist/ 生成产物的直接编辑，并提示回到 src/components 后重新构建。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./generated-dist-guard.ts", import.meta.url),
  order: 20,
  timeoutSeconds: 5,
  statusMessage: "Checking generated output",
});

export async function run(payload: NormalizedHookPayload): Promise<NormalizedHookResult | null> {
  if (payload.event !== HookEvent.PreToolUse) return null;
  const targets = payload.tool?.fileTargets ?? [];
  const generatedTargets = targets.filter((target) =>
    target === "dist" || target.startsWith("dist/") || target.includes("/dist/"),
  );
  if (generatedTargets.length === 0) return null;

  return {
    kind: "deny",
    message: [
      "Generated dist output cannot be edited directly.",
      "Update `src/components/` instead, then run `npm run build:components` to regenerate `dist/claude/` and `dist/codex/`.",
      `Generated target(s): ${generatedTargets.join(", ")}`,
    ].join("\n"),
  };
}
