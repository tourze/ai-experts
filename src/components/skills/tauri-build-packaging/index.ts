import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tauriBuildPackagingSkill = defineSkill({
  id: "tauri-build-packaging",
  fullName: "Tauri v2 构建与分发",
  description: "当用户要打包桌面应用、bundle 配置、代码签名、公证、自动更新、sidecar、externalBin、CI 矩阵或体积优化时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "build-packaging-patterns",
      source: new URL("./references/build-packaging-patterns.md", import.meta.url),
      target: "references/build-packaging-patterns.md",
      title: "build-packaging-patterns.md",
      summary: "Reference material for tauri-build-packaging.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for tauri-build-packaging.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
