import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pestelAnalysisSkill = defineSkill({
  id: "pestel-analysis",
  fullName: "PESTEL 宏观环境分析",
  description: "当用户要用 PESTEL/PEST 做宏观环境分析、外部因素评估或战略环境扫描时使用。",
  useCases: [
    "年度战略规划、新市场进入或重大投资决策前的宏观环境扫描。",
    "监管政策变化、技术趋势转折或经济周期变动时评估对业务的影响。",
    "与 [porters-five-forces](../porters-five-forces/SKILL.md) 配合做行业分析，与 [swot-analysis](../swot-analysis/SKILL.md) 配合把外部因素转化为机会和威胁。",
    "融资路演中需要展示对宏观环境的理解。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
