import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const consultingAnalysisSkill = defineSkill({
  id: "consulting-analysis",
  description: "当用户要产出咨询级研究报告、市场分析、消费者洞察、品牌研究、财务分析、竞品情报或投融资尽调文档时使用。适合“先搭分析框架，再基于可靠数据写成报告”的任务。",
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
      summary: "Eval cases for consulting-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
