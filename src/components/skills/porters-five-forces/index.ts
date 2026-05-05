import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const portersFiveForcesSkill = defineSkill({
  id: "porters-five-forces",
  fullName: "波特五力",
  description: "当用户要做行业吸引力分析、判断竞争压力、供应商/买方权力或替代威胁时使用；适合市场进入、战略评估和商业环境诊断。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "3c-strategic-triangle",
      source: new URL("./references/3c-strategic-triangle.md", import.meta.url),
      target: "references/3c-strategic-triangle.md",
      title: "3c-strategic-triangle.md",
      summary: "Reference material for porters-five-forces.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "strategy-clock",
      source: new URL("./references/strategy-clock.md", import.meta.url),
      target: "references/strategy-clock.md",
      title: "strategy-clock.md",
      summary: "Reference material for porters-five-forces.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for porters-five-forces.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
