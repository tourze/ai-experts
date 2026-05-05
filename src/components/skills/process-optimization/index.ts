import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const processOptimizationSkill = defineSkill({
  id: "process-optimization",
  fullName: "流程优化",
  description: "当用户要诊断流程低效、梳理瓶颈、缩短周期或重构协作链路时使用；帮助从现状、浪费、未来状态和指标四个维度优化流程。",
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
      summary: "Eval cases for process-optimization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
