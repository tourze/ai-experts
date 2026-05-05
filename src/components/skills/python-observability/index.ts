import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const pythonObservabilitySkill = defineSkill({
  id: "python-observability",
  description: "当用户要给 Python 服务补结构化日志、指标、trace、请求上下文和故障定位能力时使用。",
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
      summary: "Eval cases for python-observability.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
