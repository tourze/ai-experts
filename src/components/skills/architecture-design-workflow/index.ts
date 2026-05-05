import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const architectureDesignWorkflowSkill = defineSkill({
  id: "architecture-design-workflow",
  fullName: "架构设计工作流",
  description: "当需要端到端推进架构设计、组织可评审方案或把零散设计想法收敛成架构文档时使用；单个 ADR 改用 `architecture-decision-records`，概念性系统设计改用 `system-design`。",
  useCases: [
    "需要从零到一完成架构设计并产出文档。",
    "需要系统化推进架构评审，避免遗漏关键假设。",
    "已有零散设计想法，需要结构化组织成可评审方案。",
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
