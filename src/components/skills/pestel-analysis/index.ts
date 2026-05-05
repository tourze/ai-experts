import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { portersFiveForcesSkill } from "../porters-five-forces/index";
import { swotAnalysisSkill } from "../swot-analysis/index";

export const pestelAnalysisSkill = defineSkill({
  id: "pestel-analysis",
  fullName: "PESTEL 宏观环境分析",
  description: "当用户要用 PESTEL/PEST 做宏观环境分析、外部因素评估或战略环境扫描时使用。",
  useCases: [
    "年度战略规划、新市场进入或重大投资决策前的宏观环境扫描。",
    "监管政策变化、技术趋势转折或经济周期变动时评估对业务的影响。",
    "与 `porters-five-forces` 配合做行业分析，与 `swot-analysis` 配合把外部因素转化为机会和威胁。",
    "融资路演中需要展示对宏观环境的理解。",
  ],
  constraints: [
    "六个维度（Political, Economic, Social, Technological, Environmental, Legal）都要扫描，但只展开与业务**有直接因果关系**的因素。",
    "每个因素必须说明**影响方向**（利好/利空/不确定）、**影响时间窗**（短期/中期/长期）和**影响量级**（高/中/低）。",
    "列举因素不等于分析；必须推导出\"所以我们应该怎么做\"的行动含义。",
    "信息必须标注来源和时效，过期的宏观数据比没有更危险。",
  ],
  checklist: [
    "六个维度都做了扫描，没有遗漏。",
    "每个关键因素有影响方向、时间窗和量级判断。",
    "从因素推导出了具体的行动含义或战略建议。",
    "数据和趋势标注了来源和时效。",
  ],
  relatedSkills: [
    {
      get id() {
        return swotAnalysisSkill.id;
      },
      reason: "与 `porters-five-forces` 配合做行业分析，与 `swot-analysis` 配合把外部因素转化为机会和威胁。",
    },
    {
      get id() {
        return portersFiveForcesSkill.id;
      },
      reason: "与 `porters-five-forces` 配合做行业分析，与 `swot-analysis` 配合把外部因素转化为机会和威胁。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "罗列新闻",
      pass: "因素 → 影响 → 行动",
    }),
    defineAntiPattern({
      fail: "只看利好不看利空",
      pass: "双面分析",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
