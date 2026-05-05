import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
    "涉及流程或不确定性时，可配合 `process-optimization` 与 `planning-under-uncertainty`。",
  ],
  constraints: [
    "先识别系统边界、参与方、激励与流量，再讨论解决方案。",
    "重点看反馈回路、延迟、库存与流量，不要只看单点事件。",
    "结论要指出杠杆点和副作用，而不是“多方协同更重要”这种空话。",
  ],
  checklist: [
    "[ ] 系统边界、关键角色和核心变量已定义。",
    "[ ] 已识别至少一条增强回路和一条平衡回路。",
    "[ ] 关键延迟、二阶效应和反直觉结果已说明。",
    "[ ] 建议动作聚焦杠杆点，而不是平均用力。",
  ],
  relatedSkills: [
    {
      get id() {
        return planningUnderUncertaintySkill.id;
      },
      reason: "涉及流程或不确定性时，可配合 `process-optimization` 与 `planning-under-uncertainty`。",
    },
    {
      get id() {
        return processOptimizationSkill.id;
      },
      reason: "涉及流程或不确定性时，可配合 `process-optimization` 与 `planning-under-uncertainty`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "channel-economics",
      source: new URL("./references/channel-economics.md", import.meta.url),
      target: "references/channel-economics.md",
      title: "channel-economics.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "greiner-growth-model",
      source: new URL("./references/greiner-growth-model.md", import.meta.url),
      target: "references/greiner-growth-model.md",
      title: "greiner-growth-model.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "value-chain-analysis",
      source: new URL("./references/value-chain-analysis.md", import.meta.url),
      target: "references/value-chain-analysis.md",
      title: "value-chain-analysis.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
