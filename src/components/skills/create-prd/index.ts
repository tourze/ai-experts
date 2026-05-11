import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { agileProductOwnerSkill } from "../agile-product-owner/index";
import { prfaqSkill } from "../prfaq/index";

export const createPrdSkill = defineSkill({
  id: "create-prd",
  fullName: "编写 PRD",
  description: "当用户需要撰写或重构 PRD、功能规格说明或需求文档、做 Epic 分解、按 INVEST 编写用户故事或 MVP 范围取舍时使用。",
  useCases: [
    "新功能立项、需求收敛、跨团队对齐、进入开发前的规格固化。",
    "如果还在验证阶段，先用 `prfaq` 定\"为什么做\"，再用 PRD 定\"怎么做\"。",
    "PRD 拆解执行：Epic 分解策略见 [references/epic-decomposition.md](references/epic-decomposition.md)，用户故事编写见 [references/user-story-patterns.md](references/user-story-patterns.md)，MVP 范围取舍见 [references/scoping-cutting.md](references/scoping-cutting.md)。",
  ],
  constraints: [
    "先写问题、目标和用户，再写方案；没有成功指标的 PRD 不完整。",
    "文档必须显式列出边界、非目标、风险与依赖，避免把所有诉求都塞进首版。",
    "PRD 是约束开发的事实来源，不是营销稿；措辞要可验证、可拆任务、可测试。",
    "10 段结构可根据项目规模裁剪，但 1-5 段为最小完整集，不可省略。",
  ],
  checklist: [
    "问题、目标、用户、成功指标已闭环。",
    "关键流程、状态变化、异常路径和边界条件已写清。",
    "已明确非目标、依赖、上线方式与回滚预案。",
    "后续可直接拆成版本规划和开发任务。",
  ],
  relatedSkills: [
    {
      get skill() {
        return prfaqSkill;
      },
      reason: "如果还在验证阶段，先用 `prfaq` 定“为什么做”，再用 PRD 定“怎么做”。",
    },
    {
      get skill() {
        return agileProductOwnerSkill;
      },
      reason: "需要把 discovery 结论转成可执行需求时，可配合 `agile-product-owner`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只有功能列表：没有问题陈述、没有目标、没有成功指标，读者不知道为什么要做、做到什么程度算完。",
      pass: "问题驱动 + 可验证指标",
    }),
    defineAntiPattern({
      fail: "“支持所有情况”",
      pass: "显式边界",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先写背景与问题、目标与成功指标、用户与场景、方案概述、详细需求；轻量 PRD 至少覆盖 1-5 段。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "中型项目补非目标与排除项、风险与依赖、发布与上线计划；完整 PRD 再补数据与监控、附录。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Epic 分解读 epic references，用户故事读 user-story references，MVP 范围取舍读 scoping references。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "确保每条需求可验证、可拆任务、可测试，并明确上线方式、回滚预案和非目标。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "PRD 10 段式结构或轻量 1-5 段最小完整集。",
      "问题、目标、用户、成功指标、关键流程、状态变化、异常路径和边界条件。",
      "非目标、依赖、风险、上线方式、回滚预案、埋点需求和后续任务拆解入口。",
    ],
  }),
  references: [
    defineReference({
      id: "epic-decomposition-patterns",
      source: new URL("./references/epic-decomposition-patterns.md", import.meta.url),
      target: "references/epic-decomposition-patterns.md",
      title: "epic-decomposition-patterns.md",
      summary: "Epic 分解模式：9 种分解策略与 Story Mapping 方法。",
      loadWhen: "需要将大型 Epic 拆解为可交付的用户故事时读取。",
    }),
    defineReference({
      id: "epic-decomposition",
      source: new URL("./references/epic-decomposition.md", import.meta.url),
      target: "references/epic-decomposition.md",
      title: "epic-decomposition.md",
      summary: "Epic 分解完整指南：从业务目标到可执行任务的拆解流程。",
      loadWhen: "需要将业务目标结构化为可交付的 Epic 和故事时读取。",
    }),
    defineReference({
      id: "scoping-cutting",
      source: new URL("./references/scoping-cutting.md", import.meta.url),
      target: "references/scoping-cutting.md",
      title: "scoping-cutting.md",
      summary: "MVP 范围取舍策略：边界划分、非目标与分阶段交付决策。",
      loadWhen: "需要确定首版范围或做功能取舍决策时读取。",
    }),
    defineReference({
      id: "scoping-guest-insights",
      source: new URL("./references/scoping-guest-insights.md", import.meta.url),
      target: "references/scoping-guest-insights.md",
      title: "scoping-guest-insights.md",
      summary: "PRD 范围界定客座洞察：评审视角下的常见范围管理陷阱。",
      loadWhen: "需要做范围评审或检查 PRD 边界是否合理时读取。",
    }),
    defineReference({
      id: "user-story-invest-checklist",
      source: new URL("./references/user-story-invest-checklist.md", import.meta.url),
      target: "references/user-story-invest-checklist.md",
      title: "user-story-invest-checklist.md",
      summary: "用户故事 INVEST 检查清单：独立性、可协商、有价值、可估算、小、可测试。",
      loadWhen: "需要检查用户故事是否满足 INVEST 质量标准时读取。",
    }),
    defineReference({
      id: "user-story-patterns",
      source: new URL("./references/user-story-patterns.md", import.meta.url),
      target: "references/user-story-patterns.md",
      title: "user-story-patterns.md",
      summary: "用户故事编写模式：标准格式、验收条件与常见结构示例。",
      loadWhen: "需要按标准格式编写用户故事及验收条件时读取。",
    }),
    defineReference({
      id: "user-story-splitting-patterns",
      source: new URL("./references/user-story-splitting-patterns.md", import.meta.url),
      target: "references/user-story-splitting-patterns.md",
      title: "user-story-splitting-patterns.md",
      summary: "用户故事拆分模式：8 种拆分策略与方法论。",
      loadWhen: "需要将过大用户故事拆分为可在 Sprint 内完成的子故事时读取。",
    }),
  ],
});
