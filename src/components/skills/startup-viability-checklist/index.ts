import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const startupViabilityChecklistSkill = defineSkill({
  id: "startup-viability-checklist",
  fullName: "创业项目可行性检查清单",
  description: "当需要快速评估创业项目整体可行性、识别创业风险或判断项目是否值得继续投入时使用。",
  useCases: [
    "当需要快速评估创业项目整体可行性、识别创业风险或判断项目是否值得继续投入时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
