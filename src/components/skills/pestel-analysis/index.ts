import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用 PESTEL 扫描宏观外部因素，把政策、经济、社会、技术、环境和法律变化转成可行动的战略含义。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标市场、行业、地区、时间窗口和战略问题，例如进入、投资、融资或风险评估。",
      "读取 `pestel-template` reference，按 Political、Economic、Social、Technological、Environmental、Legal 六维扫描。",
      "每个关键因素都标注来源、时效、影响方向、时间窗、量级和不确定性。",
      "只展开与业务有直接因果关系的因素，不把新闻罗列当作分析。",
      "用影响矩阵判断立即行动、制定方案、纳入路线图、情景规划或保持监测。",
      "需要行业结构判断时联动 `porters-five-forces`；需要转成机会/威胁时联动 `swot-analysis`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "PESTEL 六维因素表。",
      "每个因素的方向、时间窗、量级、来源和时效。",
      "高影响因素的行动含义和风险/机会判断。",
      "影响矩阵、监测项和后续战略分析入口。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "pestel-template",
      source: new URL("./references/pestel-template.md", import.meta.url),
      target: "references/pestel-template.md",
      title: "PESTEL 分析模板",
      summary: "PESTEL 六维扫描表、常见扫描点和影响矩阵。",
      loadWhen: "需要展开宏观因素扫描、填写 PESTEL 表格或判断影响优先级时读取。",
    }),
  ],
});
