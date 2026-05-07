import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { agileProductOwnerSkill } from "../agile-product-owner/index";
import { systemsThinkingSkill } from "../systems-thinking/index";

export const processOptimizationSkill = defineSkill({
  id: "process-optimization",
  fullName: "流程优化",
  description: "当用户要诊断流程低效、梳理瓶颈、缩短周期或重构协作链路时使用；帮助从现状、浪费、未来状态和指标四个维度优化流程。",
  useCases: [
    "运营、交付、审批、售前、需求流转等流程过慢或质量不稳。",
    "需要从系统视角看依赖关系时，可配合 `systems-thinking`；涉及 Backlog 或 Sprint 流程时，可配合 `agile-product-owner`。",
  ],
  constraints: [
    "先画出现状流程和等待点，再讨论优化；不要跳过事实直接给方案。",
    "优化目标必须量化，例如周期、一次通过率、返工率或等待时间。",
    "先消除瓶颈和无价值步骤，再考虑自动化。",
  ],
  checklist: [
    "现状流程、瓶颈和浪费点已画清。",
    "未来状态流程说明了责任、输入输出与指标。",
    "已区分流程问题、资源问题和能力问题。",
    "变更后有验证指标和回顾节奏。",
  ],
  relatedSkills: [
    {
      get id() {
        return agileProductOwnerSkill.id;
      },
      reason: "需要从系统视角看依赖关系时，可配合 `systems-thinking`；涉及 Backlog 或 Sprint 流程时，可配合 `agile-product-owner`。",
    },
    {
      get id() {
        return systemsThinkingSkill.id;
      },
      reason: "需要从系统视角看依赖关系时，可配合 `systems-thinking`；涉及 Backlog 或 Sprint 流程时，可配合 `agile-product-owner`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "AI 自动化一切",
      pass: "先量化 + 修瓶颈",
    }),
    defineAntiPattern({
      fail: "不画现状",
      pass: "现状图 + 数据",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先画出现状流程、参与角色、输入输出、等待点、返工点和当前指标。",
      "区分流程问题、资源问题、能力问题和系统激励问题；系统性依赖可联动 `systems-thinking`。",
      "找出瓶颈、无价值步骤、重复审批、信息丢失和自动化前应先消除的问题。",
      "设计未来状态流程，明确责任人、SLA、交接标准、异常处理和验证指标。",
      "输出变更顺序、试点范围、风险和复盘节奏。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "流程表列：步骤、责任人、周期、等待/返工、是否保留。",
    ],
  }),
  tools: [],
});
