import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const subagentDrivenDevelopmentSkill = defineSkill({
  id: "subagent-driven-development",
  fullName: "子代理驱动开发",
  description: "当用户明确要求子代理/worker/多 agent/并行实现，并需要按计划派遣与审查时使用。",
  useCases: [
    "有一份实现计划或 Execution Contract（来自 `task-decomposer`、`feature-dev`、`persistent-planning` 等），且用户明确要求子代理、worker、多 agent 或并行实现。",
    "需要消费 `task-decomposer` 输出的 `waves` / `read_scope` / `write_scope` / `acceptance`，并把计划推进到实际修改。",
    "需要在当前会话中连续执行多个任务而不污染主上下文。",
    "需要按 wave 执行、验收、审查和集成多个相互独立的实现任务。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "同一 wave 写范围重叠仍并行派遣。",
      pass: "先重排 wave 或合并任务，确保 `write_scope` 不重叠。",
    }),
    defineAntiPattern({
      fail: "子代理说测试通过，主会话就接受 command 验收。",
      pass: "主会话重新运行 `acceptance.command` 并记录命令、退出码和关键输出。",
    }),
    defineAntiPattern({
      fail: "把规格审查和代码质量审查合并，或先审代码质量。",
      pass: "先确认做对了事，再确认事做得好。",
    }),
  ],
  checklist: [
    "一次性读取了完整计划",
    "计划已规整为 wave，并检查同 wave `write_scope` 不重叠",
    "每个实现任务都有 `write_scope` 与验收引用",
    "为每个任务创建了 Todo",
    "每个任务都用独立子代理实现",
    "子代理收到了完整任务文本、读写范围和验收项（不是让它自己去读文件）",
    "每个任务都经过了规格合规审查",
    "规格通过后才进入代码质量审查",
    "主会话已运行所有 `evidence_type: \"command\"` 的验收命令并记录结果",
    "非命令验收项已有 diff/artifact/manual 证据",
    "审查不通过的都经过了修复 + 重审",
    "所有任务完成后做了全局审查",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在用户明确要求多 agent/worker/并行实现时，按 wave、读写范围、验收证据和双阶段审查推进执行计划。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "一次性读取完整计划或 Execution Contract，提取 tasks、depends_on、read_scope、write_scope、acceptance_refs 和 acceptance。",
      "将任务规整为 wave；同一 wave 只有 `write_scope` 互不重叠且依赖已完成的任务才能并行。",
      "为每个任务创建 Todo，任务缺 `write_scope`、验收引用或 command 证据命令时先补计划。",
      "派遣时给每个全新子代理完整任务文本、项目上下文、read/write 范围、依赖和验收详情，不让它自己读计划文件。",
      "处理 DONE、DONE_WITH_CONCERNS、NEEDS_CONTEXT、BLOCKED 四种状态；BLOCKED 必须补上下文、换模型、拆任务或升级用户。",
      "先做规格合规审查，确认实现匹配计划且没有 YAGNI；通过后再做代码质量审查。",
      "按 acceptance_refs 收集 command、diff、artifact 或 manual 证据；command 必须由主会话运行。",
      "当前 wave 全部审查通过且证据齐备后，才集成结果并进入下一 wave；全部完成后做全局审查和分支收尾。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Wave 执行表：任务、依赖、read_scope、write_scope、acceptance_refs、并行性和状态。",
      "审查记录：规格合规、代码质量、修复重审、BLOCKED 处理和最终全局审查。",
      "验收证据：command/diff/artifact/manual 的命令、退出码、关键输出、检查范围和未覆盖项。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "prompt-templates",
      source: new URL("./references/prompt-templates.md", import.meta.url),
      target: "references/prompt-templates.md",
      title: "prompt-templates.md",
      summary: "子代理提示词模板，包含任务派遣、范围约束和验收指令的标准化格式。",
      loadWhen: "需要编写子代理任务派遣提示词或标准化子代理指令格式时读取。",
    }),
  ],
});
