import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const twigComponentsSkill = defineSkill({
  id: "twig-components",
  description: "当用户要抽取 Twig 视图片段、实现 TwigComponent、LiveComponent 状态、props、表单联动或模板复用时使用。",
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
      summary: "Eval cases for twig-components.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
