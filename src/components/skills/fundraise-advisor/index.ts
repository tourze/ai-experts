import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fundraiseAdvisorSkill = defineSkill({
  id: "fundraise-advisor",
  description: "当用户要准备融资、理清轮次策略、准备投资人沟通或梳理融资故事时使用；适用于 pre-seed 到 seed 阶段的筹资准备与节奏管理。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Reference material for fundraise-advisor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for fundraise-advisor.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
