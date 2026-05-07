import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { featureDevSkill } from "../feature-dev/index";
import { planReviewSkill } from "../plan-review/index";
import { subagentDrivenDevelopmentSkill } from "../subagent-driven-development/index";

export const taskDecomposerSkill = defineSkill({
  id: "task-decomposer",
  fullName: "task-decomposer",
  description: "当用户要把复杂需求拆成任务板、依赖关系、关键路径或并行工作项时使用。",
  useCases: [
    "适合复杂功能、跨团队协作、需要排关键路径和并行度的实现计划。",
    "适合从模糊需求落到可执行任务，而不是只列几句待办。",
    "当用户要为后续子代理/多 agent 执行准备计划或交接文本时，输出 Execution Contract。",
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
  relatedSkills: [
    {
      get id() {
        return planReviewSkill.id;
      },
      reason: "需要先审查计划质量、风险、依赖或回滚验证路径时联动。",
    },
    {
      get id() {
        return featureDevSkill.id;
      },
      reason: "拆解对象是完整功能开发，需要进入发现、设计、实现和验证工作流时联动。",
    },
    {
      get id() {
        return subagentDrivenDevelopmentSkill.id;
      },
      reason: "用户明确要求按 Execution Contract 派遣子代理、worker、多 agent 或并行执行时联动。",
    },
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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把复杂需求拆成可执行任务板、依赖图、关键路径、并行 wave、验收标准和可交接的 Execution Contract。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先写清用户目标、验收标准、范围边界、非目标和关键假设；需求太模糊时先列假设，不硬拆。",
      "默认按 Foundation、Core Logic、Integration、Polish 四阶段组织，并读取 decomposition-patterns、sizing-guide 和 edge-case-checklist。",
      "显式区分硬依赖、软依赖和可并行任务；关键路径和高风险项必须标注。",
      "每个任务切到单 PR 可完成、可验证、可交付，并同时覆盖开发、边界场景、验证和发布。",
      "需要子代理/多 agent 计划时追加 Execution Contract：waves、read_scope、write_scope、depends_on、acceptance_refs 和 acceptance。",
      "同一 wave 的 write_scope 不能重叠；实现任务必须至少绑定一个 acceptance_ref，command 验收只放真实可运行命令。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "任务表、阶段、依赖箭头、关键路径、并行组、风险标记和测试等级。",
      "单 PR 粒度任务、边界场景、验证方式、发布/回滚注意事项。",
      "Execution Contract JSON：goal、waves、tasks、read_scope、write_scope、acceptance_refs 和 acceptance。",
    ],
  }),
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
