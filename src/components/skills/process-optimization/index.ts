import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const processOptimizationSkill = defineSkill({
  id: "process-optimization",
  fullName: "流程优化",
  description: "当用户要诊断流程低效、梳理瓶颈、缩短周期或重构协作链路时使用；帮助从现状、浪费、未来状态和指标四个维度优化流程。",
  useCases: [
    "运营、交付、审批、售前、需求流转等流程过慢或质量不稳。",
    "需要从系统视角看依赖关系时，可配合 [systems-thinking](../systems-thinking/SKILL.md)；涉及 Backlog 或 Sprint 流程时，可配合 [agile-product-owner](../agile-product-owner/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
