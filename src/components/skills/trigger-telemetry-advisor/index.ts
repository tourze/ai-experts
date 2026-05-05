import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const triggerTelemetryAdvisorSkill = defineSkill({
  id: "trigger-telemetry-advisor",
  fullName: "Trigger Telemetry Advisor",
  description: "当用户要分析 hook/skill telemetry、触发审计、dispatch 错误或 SKILL 脚本运行故障时使用。",
  useCases: [
    "当用户要分析 hook/skill telemetry、触发审计、dispatch 错误或 SKILL 脚本运行故障时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
