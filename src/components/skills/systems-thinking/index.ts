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
import { planningUnderUncertaintySkill } from "../planning-under-uncertainty/index";
import { processOptimizationSkill } from "../process-optimization/index";

export const systemsThinkingSkill = defineSkill({
  id: "systems-thinking",
  fullName: "系统思维",
  description: "当用户要分析多方参与、激励错位、二阶效应或复杂系统动态时使用；帮助识别结构、反馈回路、杠杆点与系统性副作用。",
  useCases: [
    "平台策略、组织协作、复杂业务链路、生态位博弈或长期副作用分析。",
    "需要经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
  ],
  constraints: [
    "先识别系统边界、参与方、激励与流量，再讨论解决方案。",
    "重点看反馈回路、延迟、库存与流量，不要只看单点事件。",
    "结论要指出杠杆点和副作用，而不是“多方协同更重要”这种空话。",
  ],
  checklist: [
    "系统边界、关键角色和核心变量已定义。",
    "已识别至少一条增强回路和一条平衡回路。",
    "关键延迟、二阶效应和反直觉结果已说明。",
    "建议动作聚焦杠杆点，而不是平均用力。",
  ],
  relatedSkills: [
    {
      get skill() {
        return planningUnderUncertaintySkill;
      },
      reason: "涉及流程或不确定性时，可配合 `process-optimization` 与 `planning-under-uncertainty`。",
    },
    {
      get skill() {
        return processOptimizationSkill;
      },
      reason: "涉及流程或不确定性时，可配合 `process-optimization` 与 `planning-under-uncertainty`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只盯症状",
      pass: "找结构",
    }),
    defineAntiPattern({
      fail: "推变更不看副作用",
      pass: "副作用清单",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先定义系统边界、时间尺度、关键参与方、资源流和要解释的结果。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按参与方 -> 激励 -> 行为 -> 结果 -> 反馈回路 -> 杠杆点展开分析。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "识别增强回路、平衡回路、延迟、库存/流量和可能的反直觉结果。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要案例或特定领域经验时读取 `guest-insights`、`channel-economics`、`greiner-growth-model` 或 `value-chain-analysis` reference。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "把症状和结构分开，指出当前动作会如何改变激励、行为和副作用。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出最小杠杆动作、监测指标和需要延迟观察的二阶效应。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "系统边界、参与方、核心变量和激励表。",
      "增强/平衡反馈回路、延迟和库存/流量分析。",
      "杠杆点、预期行为变化和副作用清单。",
      "建议动作、监测指标和复盘时间点。",
    ],
  }),
  references: [
    defineReference({
      id: "channel-economics",
      source: new URL("./references/channel-economics.md", import.meta.url),
      target: "references/channel-economics.md",
      title: "channel-economics.md",
      summary: "渠道经济学的系统思维分析，包含渠道激励、冲突和生态位博弈模型。",
      loadWhen: "需要分析多层级渠道、激励错配或平台生态动态时读取。",
    }),
    defineReference({
      id: "greiner-growth-model",
      source: new URL("./references/greiner-growth-model.md", import.meta.url),
      target: "references/greiner-growth-model.md",
      title: "greiner-growth-model.md",
      summary: "Greiner 组织增长模型详解，包含企业在不同成长阶段的管理危机和转型模式。",
      loadWhen: "需要分析组织发展阶段、管理危机或规模扩张中的系统性挑战时读取。",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "系统思维经验参考集合，包含真实案例中的反馈回路、杠杆点和副作用分析。",
      loadWhen: "需要系统思维的实际案例参考或验证分析假设时读取。",
    }),
    defineReference({
      id: "value-chain-analysis",
      source: new URL("./references/value-chain-analysis.md", import.meta.url),
      target: "references/value-chain-analysis.md",
      title: "value-chain-analysis.md",
      summary: "价值链分析框架和在系统思维中的应用，帮助识别关键活动和价值流动。",
      loadWhen: "需要从价值链角度分析业务系统或识别关键的增值环节时读取。",
    }),
  ],
});
