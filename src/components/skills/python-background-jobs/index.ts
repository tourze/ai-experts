import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const pythonBackgroundJobsSkill = defineSkill({
  id: "python-background-jobs",
  description: "当用户要实现任务队列、worker、重试、幂等、死信队列或把长任务从请求链路中解耦时使用。",
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
      summary: "Eval cases for python-background-jobs.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
