import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const taskDecomposerSkill = defineSkill({
  id: "task-decomposer",
  fullName: "task-decomposer",
  description: "当用户要把复杂需求拆成任务板、依赖关系、关键路径或并行工作项时使用。",
  useCases: [
    "适合复杂功能、跨团队协作、需要排关键路径和并行度的实现计划。",
    "适合从模糊需求落到可执行任务，而不是只列几句待办。",
    "交叉引用：先审计划质量用 `plan-review`；需要完整功能工作流用 `feature-dev`；需要把拆解结果持久化到文件用 `persistent-planning`。",
    "当用户要为后续子代理/多 agent 执行准备计划或交接文本时，输出 Execution Contract，供 `subagent-driven-development` 消费。",
  ],
  constraints: [
    "任务粒度要能在单个 PR 内完成、可验证、可交付。",
    "必须显式区分硬依赖、软依赖和可并行任务。",
    "标记可并行任务时必须给出 `read_scope` / `write_scope`；同一并行组内 `write_scope` 重叠则不能并行。",
    "要同时覆盖边界场景、风险和测试策略，不要只拆开发任务。",
    "如果需求太模糊，要先写清假设而不是硬拆。",
  ],
  checklist: [
    "是否写清了用户目标、验收标准和范围边界。",
    "是否把任务切到单 PR 可完成的粒度。",
    "是否为每阶段补齐边界场景和测试方式。",
    "是否标记关键路径、并行项和高风险项。",
    "若输出 Execution Contract，是否检查了同 wave `write_scope` 不重叠且实现任务都有验收引用。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "太粗",
      pass: "单 PR 粒度",
    }),
    defineAntiPattern({
      fail: "太细",
      pass: "单元 = \"可独立 demo\"",
    }),
    defineAntiPattern({
      fail: "只拆编码",
      pass: "编码 + 验证 + 发布",
    }),
    defineAntiPattern({
      fail: "并行任务写同一范围：两个任务会争抢同一实现区域，不能并行。",
      pass: "并行前先隔离写范围：写范围互不重叠，且都有验收引用，可以交给执行阶段判断是否并行。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "decomposition-patterns",
      source: new URL("./references/decomposition-patterns.md", import.meta.url),
      target: "references/decomposition-patterns.md",
      title: "decomposition-patterns.md",
      summary: "各种任务拆解策略，包括功能分解、阶段拆分和分层拆解模式。",
      loadWhen: "需要参考不同拆解模式来设计任务结构时读取。",
    }),
    defineReference({
      id: "dependency-mapping",
      source: new URL("./references/dependency-mapping.md", import.meta.url),
      target: "references/dependency-mapping.md",
      title: "dependency-mapping.md",
      summary: "任务间依赖关系类型（硬依赖、软依赖、并行）的识别与建模方法。",
      loadWhen: "需要梳理任务间依赖关系或判断并行可行性时读取。",
    }),
    defineReference({
      id: "edge-case-checklist",
      source: new URL("./references/edge-case-checklist.md", import.meta.url),
      target: "references/edge-case-checklist.md",
      title: "edge-case-checklist.md",
      summary: "任务拆解时需覆盖的边界场景、风险区域和异常路径检查清单。",
      loadWhen: "需要确保拆解方案覆盖了非正常路径和风险场景时读取。",
    }),
    defineReference({
      id: "persistent-planning",
      source: new URL("./references/persistent-planning.md", import.meta.url),
      target: "references/persistent-planning.md",
      title: "persistent-planning.md",
      summary: "将拆解结果持久化为可追踪的计划文件的格式与规范。",
      loadWhen: "需要把任务拆解结果保存到文件或传给后续流程时读取。",
    }),
    defineReference({
      id: "sizing-guide",
      source: new URL("./references/sizing-guide.md", import.meta.url),
      target: "references/sizing-guide.md",
      title: "sizing-guide.md",
      summary: "任务粒度的评估标准与单 PR 可完成性的判断指南。",
      loadWhen: "需要判断任务粒度是否合适或是否需要进一步拆分时读取。",
    }),
  ],
});
