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
import { marketSizingAnalysisSkill } from "../market-sizing-analysis/index";

export const fundraiseAdvisorSkill = defineSkill({
  id: "fundraise-advisor",
  fullName: "融资顾问",
  description: "当用户要准备融资、理清轮次策略、准备投资人沟通或梳理融资故事时使用；适用于 pre-seed 到 seed 阶段的筹资准备与节奏管理。",
  useCases: [
    "规划融资窗口、目标轮次、投资人名单、会前材料和跟进节奏。",
    "需要展开完整方法时，阅读 [references/full-guide.md](references/full-guide.md)。",
  ],
  constraints: [
    "先确认融资目的、跑道、关键里程碑和资金用途，再决定金额与轮次。",
    "融资故事必须围绕问题、牵引力、市场、团队和资金用途构建，避免空泛愿景。",
    "投资人沟通要持续更新事实与风险，不要夸大不可验证指标。",
  ],
  checklist: [
    "融资目的、目标金额、跑道和里程碑清晰。",
    "Deck、数据室和会前口径一致。",
    "已准备投资人分层、跟进节奏和问答清单。",
    "市场规模、增长和团队叙事可被证据支撑。",
  ],
  relatedSkills: [
    {
      get skill() {
        return marketSizingAnalysisSkill;
      },
      reason: "需要市场规模支撑时配合 `market-sizing-analysis`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "资金用途模糊",
      pass: "里程碑驱动",
    }),
    defineAntiPattern({
      fail: "同时推所有投资人",
      pass: "三级名单 + 节奏",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认融资目的、跑道、目标金额、关键里程碑、资金用途和当前牵引力。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "把融资故事拆成问题/机会、牵引力、市场、团队、资金用途和下一阶段里程碑。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "投资人按优先级分层推进，保持会前材料、Deck、数据室和口径一致。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要展开完整流程时读取 `full-guide`，市场规模证据不足时联动 market sizing。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "融资目的、轮次、金额、跑道、里程碑和资金用途。",
      "问题/机会、牵引力、市场、团队等模块的关键信息和证据。",
      "投资人分层、跟进节奏、问答清单和不可夸大的风险边界。",
    ],
  }),
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Pre-seed 到 Seed 轮融资的完整流程指南，包括轮次策略、投资人沟通和节奏管理。",
      loadWhen: "需要展开完整融资准备工作或了解各阶段具体执行方法时读取。",
    }),
  ],
});
