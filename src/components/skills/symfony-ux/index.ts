import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const symfonyUxSkill = defineSkill({
  id: "symfony-ux",
  fullName: "Symfony UX",
  description: "当用户要在 Symfony 项目中选择 Stimulus、Turbo、UX 套件、前端交互方案、异步片段刷新或组件组合策略时使用。",
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
      summary: "Eval cases for symfony-ux.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
