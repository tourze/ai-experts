import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidDesignGuidelinesSkill = defineSkill({
  id: "android-design-guidelines",
  description: "当用户要构建或评审 Android UI、应用 Material Design 3 规范、动态颜色、Compose 组件或自适应布局时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "rules-4-to-10",
      source: new URL("./references/rules-4-to-10.md", import.meta.url),
      target: "references/rules-4-to-10.md",
      title: "rules-4-to-10.md",
      summary: "Reference material for android-design-guidelines.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for android-design-guidelines.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
