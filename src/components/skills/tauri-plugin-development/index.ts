import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tauriPluginDevelopmentSkill = defineSkill({
  id: "tauri-plugin-development",
  description: "在创建自定义 Tauri v2 插件、处理生命周期钩子、桌面/移动拆分、插件状态、命令注册、JS API 或权限定义时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "plugin-dev-patterns",
      source: new URL("./references/plugin-dev-patterns.md", import.meta.url),
      target: "references/plugin-dev-patterns.md",
      title: "plugin-dev-patterns.md",
      summary: "Reference material for tauri-plugin-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for tauri-plugin-development.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
