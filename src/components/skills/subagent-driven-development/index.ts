import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const subagentDrivenDevelopmentSkill = defineSkill({
  id: "subagent-driven-development",
  fullName: "子代理驱动开发",
  description: "当用户明确要求子代理/worker/多 agent/并行实现，并需要按计划派遣与审查时使用。",
  useCases: [
    "有一份实现计划或 Execution Contract（来自 `task-decomposer`、`feature-dev`、`persistent-planning` 等），且用户明确要求子代理、worker、多 agent 或并行实现。",
    "需要消费 `task-decomposer` 输出的 `waves` / `read_scope` / `write_scope` / `acceptance`，并把计划推进到实际修改。",
    "需要在当前会话中连续执行多个任务而不污染主上下文。",
    "交叉引用：任务拆解用 `task-decomposer`；方案审查用 `plan-review`；完成后用 `finishing-branch`。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "执行前必须把计划规整为 wave；没有 wave 时按依赖关系先生成顺序 wave。",
    "同一 wave 只有 `write_scope` 互不重叠的任务才能并行；重叠任务必须拆到不同 wave 或合并。",
    "实现任务必须有 `write_scope` 和验收引用；缺失时先补计划，不派遣。",
    "子代理可读取范围 = `read_scope ∪ write_scope`；`read_scope` 不必重复列出将要编辑的文件。",
    "每个任务用全新子代理执行，不复用会话上下文。",
    "子代理接收完整任务文本、读写范围、依赖、验收项，不让子代理自己去读计划文件。",
    "必须经过双阶段审查：先规格合规，再代码质量，顺序不可颠倒。",
    "`evidence_type: \"command\"` 的验收项必须由主会话运行并记录结果，不能只采信子代理报告。",
    "审查不通过 → 修复 → 重新审查，直到通过。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "prompt-templates",
      source: new URL("./references/prompt-templates.md", import.meta.url),
      target: "references/prompt-templates.md",
      title: "prompt-templates.md",
      summary: "Reference material for subagent-driven-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
