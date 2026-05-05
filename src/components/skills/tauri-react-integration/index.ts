import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tauriReactIntegrationSkill = defineSkill({
  id: "tauri-react-integration",
  fullName: "Tauri v2 + React 集成",
  description: "当用户要集成 React 前端、invoke 封装、useInvoke Hook、事件监听生命周期、Router 深链接、WebView 限制或错误边界时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "deeplink-state-sync-patterns",
      source: new URL("./references/deeplink-state-sync-patterns.md", import.meta.url),
      target: "references/deeplink-state-sync-patterns.md",
      title: "deeplink-state-sync-patterns.md",
      summary: "Reference material for tauri-react-integration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "react-integration-patterns",
      source: new URL("./references/react-integration-patterns.md", import.meta.url),
      target: "references/react-integration-patterns.md",
      title: "react-integration-patterns.md",
      summary: "Reference material for tauri-react-integration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for tauri-react-integration.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
