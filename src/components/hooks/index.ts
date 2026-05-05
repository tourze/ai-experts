import { defineHook, HookEvent, KnownTool, Platform } from "../sdk";

export const componentRoutingReminder = defineHook({
  id: "component-routing-reminder",
  description: "在涉及组件、skill、agent、hook 或 dist 的请求前注入新架构路由提醒。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./component-routing-reminder/index.ts", import.meta.url),
  order: 10,
  timeoutSeconds: 5,
  statusMessage: "Checking component routing",
});

export const generatedDistGuard = defineHook({
  id: "generated-dist-guard",
  description: "检测对 dist/ 生成产物的直接编辑，并提示回到 src/components 后重新构建。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./generated-dist-guard/index.ts", import.meta.url),
  order: 20,
  timeoutSeconds: 5,
  statusMessage: "Checking generated output",
});
