import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
