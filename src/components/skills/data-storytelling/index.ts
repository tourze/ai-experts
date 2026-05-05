import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dataStorytellingSkill = defineSkill({
  id: "data-storytelling",
  fullName: "data-storytelling",
  description: "当用户要把数据分析结果转成业务叙事、executive narrative、KPI storyline、洞察结论、建议路径或汇报口径时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "t8-syntax",
      source: new URL("./references/t8-syntax.md", import.meta.url),
      target: "references/t8-syntax.md",
      title: "t8-syntax.md",
      summary: "Reference material for data-storytelling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for data-storytelling.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
