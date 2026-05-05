import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidArchitectureSkill = defineSkill({
  id: "android-architecture",
  description: "当用户要设计或重构 Android 架构、Clean Architecture、Hilt 注入或多模块时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for android-architecture.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
