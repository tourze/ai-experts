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
