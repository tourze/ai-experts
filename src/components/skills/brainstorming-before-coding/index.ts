import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { featureDevSkill } from "../feature-dev/index";
import { planReviewSkill } from "../plan-review/index";
import { taskDecomposerSkill } from "../task-decomposer/index";

export const brainstormingBeforeCodingSkill = defineSkill({
  id: "brainstorming-before-coding",
  fullName: "编码前头脑风暴",
  description:
    "当用户要在创建功能、构建组件、添加新行为或修改架构前做设计澄清和方案选择时使用。简单修 bug 或单行改动不需要。",
  useCases: [
    "用户要做新功能、新组件、新模块。",
    "用户要做架构级改造或重构。",
    '用户说"帮我做一个 X"但 X 的边界和设计不明确。',
    "设计确认后需要再拆解实现计划或进入功能开发。",
  ],
  constraints: [
    '**违反字面规则 = 违反规则精神。不存在"灵活变通"。**',
    "<HARD-GATE> 在展示设计方案并获得用户批准之前，不启动任何实现 skill、不写任何代码、不创建任何文件、不做任何脚手架操作。无论任务看起来多简单，都适用。 </HARD-GATE>",
  ],
  relatedSkills: [
    {
      get skill() {
        return featureDevSkill;
      },
      reason: "用户批准设计后，需要进入完整功能开发实现时联动。",
    },
    {
      get skill() {
        return taskDecomposerSkill;
      },
      reason: "设计批准后需要拆解任务、依赖或 Execution Contract 时联动。",
    },
    {
      get skill() {
        return planReviewSkill;
      },
      reason: "设计方案仍需风险评审、边界检查或可执行性压力测试时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: '"这个太简单了，不需要设计"——跳过设计流程直接写代码。',
      pass: "每个项目都走设计流程，简单项目设计可以短但必须展示并获得批准。",
    }),
  ],
  checklist: [
    "已探索项目上下文（文件、文档、提交）",
    "已通过提问理解用户意图和约束",
    "已提出 2-3 个方案并附权衡",
    "已分段展示设计并获得确认",
    "用户明确批准了设计方案",
    "才转向实现",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先探索相关文件、文档、最近提交和已有模式；多子系统请求先建议拆分。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "一次只问一个澄清问题，优先选择题，聚焦目的、约束和成功标准。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "提出 2-3 个方案，每个方案附权衡，明确推荐方案和原因，让用户选择。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "分段展示设计，按复杂度控制篇幅，覆盖架构、组件、数据流、错误处理和测试策略。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "每段后确认理解；用户否定时回到澄清或方案阶段修正。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "只有用户明确批准设计后，才转向 feature-dev、task-decomposer 或 plan-review。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "若用户 prompt 已给完整设计规格，或明确说直接做/不用讨论，确认理解后可简化。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "上下文摘要：相关文件、已有模式、约束、非目标和风险。",
      "方案对比：2-3 个方案、权衡、推荐理由和用户选择。",
      "批准记录：确认过的设计段、仍待确认点、进入实现的条件和后续 skill。",
    ],
  }),
});
