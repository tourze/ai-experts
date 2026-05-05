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
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
