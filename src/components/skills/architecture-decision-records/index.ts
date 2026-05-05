import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const architectureDecisionRecordsSkill = defineSkill({
  id: "architecture-decision-records",
  description: "当用户需要为架构决策写 ADR、做系统边界分析（服务划分/数据所有权/一致性边界）、设计接口契约（版本策略/向后兼容/breaking change 流程）、管理复杂度（深模块/信息隐藏）或制定弹性策略（超时/重试/熔断/降级）时使用。与 system-design 互补：后者给架构全貌，本 skill 给决策方法与契约模板。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for architecture-decision-records.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
