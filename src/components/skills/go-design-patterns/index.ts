import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goDesignPatternsSkill = defineSkill({
  id: "go-design-patterns",
  fullName: "Go 设计模式",
  description: "当 Go 代码涉及架构模式、函数式选项、构造器设计、init() 避免、韧性模式、资源管理、DI 或 Clean Architecture 时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "di",
      source: new URL("./references/di.md", import.meta.url),
      target: "references/di.md",
      title: "di.md",
      summary: "Reference material for go-design-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-design-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
