import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitPlanSkill = defineSkill({
  id: "speckit-plan",
  fullName: "Speckit Plan",
  description: "当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。",
  useCases: [
    "当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
