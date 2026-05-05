import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { marketSizingAnalysisSkill } from "../market-sizing-analysis/index";

export const fundraiseAdvisorSkill = defineSkill({
  id: "fundraise-advisor",
  fullName: "融资顾问",
  description: "当用户要准备融资、理清轮次策略、准备投资人沟通或梳理融资故事时使用；适用于 pre-seed 到 seed 阶段的筹资准备与节奏管理。",
  useCases: [
    "规划融资窗口、目标轮次、投资人名单、会前材料和跟进节奏。",
    "需要展开完整方法时，阅读 [references/full-guide.md](references/full-guide.md)。",
    "需要市场规模支撑时配合 `market-sizing-analysis`。",
  ],
  constraints: [
    "先确认融资目的、跑道、关键里程碑和资金用途，再决定金额与轮次。",
    "融资故事必须围绕问题、牵引力、市场、团队和资金用途构建，避免空泛愿景。",
    "投资人沟通要持续更新事实与风险，不要夸大不可验证指标。",
  ],
  relatedSkills: [
    {
      get id() {
        return marketSizingAnalysisSkill.id;
      },
      reason: "需要市场规模支撑时配合 `market-sizing-analysis`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Reference material for fundraise-advisor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
