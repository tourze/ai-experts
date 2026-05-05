import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const architectureDecisionRecordsSkill = defineSkill({
  id: "architecture-decision-records",
  fullName: "架构决策记录与系统边界分析",
  description: "当用户需要为架构决策写 ADR、做系统边界分析（服务划分/数据所有权/一致性边界）、设计接口契约（版本策略/向后兼容/breaking change 流程）、管理复杂度（深模块/信息隐藏）或制定弹性策略（超时/重试/熔断/降级）时使用。与 system-design 互补：后者给架构全貌，本 skill 给决策方法与契约模板。",
  useCases: [
    "需要把架构决策写成 ADR（Architecture Decision Record）格式",
    "系统边界模糊：服务该拆还是该合、数据归谁、一致性怎么保证",
    "接口需要版本策略和 breaking change 治理流程",
    "方案评审时需要显式写 trade-off，不用\"最佳实践\"搪塞",
    "弹性策略设计：超时、重试、熔断、降级的边界和组合",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "contract-templates",
      source: new URL("./references/contract-templates.md", import.meta.url),
      target: "references/contract-templates.md",
      title: "contract-templates.md",
      summary: "Reference material for architecture-decision-records.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
