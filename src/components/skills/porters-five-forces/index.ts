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
import { competitiveIntelligenceSkill } from "../competitive-intelligence/index";
import { swotAnalysisSkill } from "../swot-analysis/index";

export const portersFiveForcesSkill = defineSkill({
  id: "porters-five-forces",
  fullName: "波特五力",
  description: "当用户要做行业吸引力分析、判断竞争压力、供应商/买方权力或替代威胁时使用；适合市场进入、战略评估和商业环境诊断。",
  useCases: [
    "新行业进入评估、市场格局判断、战略机会复盘。",
    "与内部能力/执行风险结合分析时，可配合 `swot-analysis`；需要单一竞品深拆时配合 `competitive-intelligence`。",
    "补充分析框架：[references/3c-strategic-triangle.md](references/3c-strategic-triangle.md) — 3C 战略三角（客户-公司-竞争对手）；[references/strategy-clock.md](references/strategy-clock.md) — 战略钟（定价-价值定位）。",
  ],
  constraints: [
    "五力分析关注行业结构，不是单个竞争对手花活。",
    "每一力都要说明强弱原因、时间尺度和对盈利能力的影响。",
    "不要把“市场大”误当作“行业结构有利”。",
  ],
  checklist: [
    "五种力量都已覆盖，没有只讲竞争对手。",
    "结论解释了行业利润空间与进入门槛。",
    "已指出哪些力量可通过战略动作改善。",
    "与目标公司的资源与定位判断能对上。",
  ],
  relatedSkills: [
    {
      get id() {
        return competitiveIntelligenceSkill.id;
      },
      reason: "需要从行业结构下钻到具体竞品、battlecard 或竞品深拆时联动。",
    },
    {
      get id() {
        return swotAnalysisSkill.id;
      },
      reason: "需要把行业结构判断连接到内部优势、劣势和执行风险时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看现有竞品",
      pass: "五力都过",
    }),
    defineAntiPattern({
      fail: "行业 vs 执行混淆",
      pass: "区分",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先界定行业边界、客户群、地理范围、时间尺度和分析对象。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "逐一分析现有竞争、潜在进入者、替代品、供应商议价力和买方议价力。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每一力都写当前强弱、驱动因素、证据、对利润的影响和可改变性。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "区分行业结构问题和单个公司的执行问题；内部能力判断可联动 `swot-analysis`。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "输出行业吸引力结论、进入/防守建议和需要进一步验证的数据。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "五力分析表列：力量、当前强弱、驱动因素、对利润的影响。",
    ],
  }),
  references: [
    defineReference({
      id: "3c-strategic-triangle",
      source: new URL("./references/3c-strategic-triangle.md", import.meta.url),
      target: "references/3c-strategic-triangle.md",
      title: "3c-strategic-triangle.md",
      summary: "3C 战略三角框架详细说明，分析客户、公司和竞争对手三者的战略关系。",
      loadWhen: "需要结合 3C 战略三角框架补充行业分析时读取。",
    }),
    defineReference({
      id: "strategy-clock",
      source: new URL("./references/strategy-clock.md", import.meta.url),
      target: "references/strategy-clock.md",
      title: "strategy-clock.md",
      summary: "战略钟框架详细说明，分析不同定价-价值定位策略的适用场景。",
      loadWhen: "需要结合战略钟框架分析定价与价值定位策略时读取。",
    }),
  ],
});
