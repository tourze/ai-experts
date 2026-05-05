import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitAnalyzeSkill = defineSkill({
  id: "speckit-analyze",
  fullName: "Speckit Analyze",
  description: "当用户要在任务拆解后审计规格、计划、任务三件套的一致性、重复、冲突或遗漏风险时使用。",
  useCases: [
    "当用户要在任务拆解后审计规格、计划、任务三件套的一致性、重复、冲突或遗漏风险时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
