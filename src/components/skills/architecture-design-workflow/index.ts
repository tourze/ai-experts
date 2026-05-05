import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const architectureDesignWorkflowSkill = defineSkill({
  id: "architecture-design-workflow",
  fullName: "架构设计工作流",
  description: "当需要端到端推进架构设计、组织可评审方案或把零散设计想法收敛成架构文档时使用；单个 ADR 改用 `architecture-decision-records`，概念性系统设计改用 `system-design`。",
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
      summary: "Eval cases for architecture-design-workflow.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
