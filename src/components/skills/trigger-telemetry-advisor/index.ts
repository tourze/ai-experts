import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const triggerTelemetryAdvisorSkill = defineSkill({
  id: "trigger-telemetry-advisor",
  description: "当用户要分析 hook/skill telemetry、触发审计、dispatch 错误或 SKILL 脚本运行故障时使用。",
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
      summary: "Eval cases for trigger-telemetry-advisor.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
