import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { fundraiseAdvisorSkill } from "../fundraise-advisor/index";
import { startupIcpDefinerSkill } from "../startup-icp-definer/index";

export const marketSizingAnalysisSkill = defineSkill({
  id: "market-sizing-analysis",
  fullName: "市场规模分析",
  description: "当用户要计算 TAM/SAM/SOM、验证市场空间、支撑商业计划或融资叙事时使用；支持 top-down、bottom-up 和 value theory 三种方法。",
  useCases: [
    "创业立项、融资材料、年度规划或新市场机会评估。",
    "需要参考 [references/data-sources.md](references/data-sources.md) 与 [examples/saas-market-sizing.md](examples/saas-market-sizing.md)。",
    "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
  ],
  constraints: [
    "同时给出方法、假设和数据来源，不允许只报一个大数字。",
    "TAM/SAM/SOM 要口径一致，避免一个按用户数、一个按收入口径混算。",
    "对新市场或新类别，优先写假设边界和不确定性，而不是装作数字很精确。",
  ],
  relatedSkills: [
    {
      get id() {
        return fundraiseAdvisorSkill.id;
      },
      reason: "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
    },
    {
      get id() {
        return startupIcpDefinerSkill.id;
      },
      reason: "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "data-sources",
      source: new URL("./references/data-sources.md", import.meta.url),
      target: "references/data-sources.md",
      title: "data-sources.md",
      summary: "Reference material for market-sizing-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
