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
import { portersFiveForcesSkill } from "../porters-five-forces/index";

export const swotAnalysisSkill = defineSkill({
  id: "swot-analysis",
  fullName: "SWOT 分析",
  description: "当用户要做 SWOT 分析、梳理优势劣势、外部机会威胁与战略动作时使用；适合产品、业务或竞争位置评估。",
  useCases: [
    "产品/公司战略评估、年度复盘、竞品对比或进入新市场前的结构化判断。",
    "需要看行业结构时配合 `porters-five-forces`；需要具体对手深拆时配合 `competitive-intelligence`。",
    "补充分析框架：[references/blue-ocean-strategy.md](references/blue-ocean-strategy.md) — 蓝海战略（ERRC 网格、策略画布）；[references/space-matrix.md](references/space-matrix.md) — SPACE 矩阵（战略态势定位）。",
  ],
  constraints: [
    "Strength/Weakness 写内部能力，Opportunity/Threat 写外部环境，别混淆。",
    "SWOT 不是四格词云，每个点都要连接到战略动作。",
    "先列事实和证据，再做判断，避免把偏好写成优势。",
  ],
  checklist: [
    "四个象限都有证据支撑而非口号。",
    "机会与威胁区分了行业变化和竞争变化。",
    "已把关键组合转成具体战略动作。",
    "分析结论能衔接资源投入与优先级决策。",
  ],
  relatedSkills: [
    {
      get skill() {
        return competitiveIntelligenceSkill;
      },
      reason: "需要从 SWOT 的机会和威胁下钻到具体竞品、定位或 battlecard 时联动。",
    },
    {
      get skill() {
        return portersFiveForcesSkill;
      },
      reason: "需要用行业结构解释外部机会、威胁和利润空间时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "\"团队努力\" 当优势",
      pass: "可证据化的能力",
    }),
    defineAntiPattern({
      fail: "四象限 + 句号",
      pass: "SO/WO/ST/WT 战略动作",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先界定分析对象、目标、时间尺度和证据来源。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "把 Strength/Weakness 限定为内部能力，把 Opportunity/Threat 限定为外部环境。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "为每个点写事实/证据、战略含义和可行动建议，避免口号和偏好。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "组合形成 SO/WO/ST/WT 动作，并按影响、可行性、风险和资源约束排序。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要行业结构或竞争视角时联动 `porters-five-forces` 或 `competitive-intelligence`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "SWOT 表列：类别、事实/证据、战略含义、建议动作。",
    ],
  }),
  references: [
    defineReference({
      id: "blue-ocean-strategy",
      source: new URL("./references/blue-ocean-strategy.md", import.meta.url),
      target: "references/blue-ocean-strategy.md",
      title: "blue-ocean-strategy.md",
      summary: "蓝海战略分析框架，包含 ERRC 网格、策略画布和红海/蓝海转换方法。",
      loadWhen: "需要在 SWOT 基础上引入蓝海战略视角或做差异化定位分析时读取。",
    }),
    defineReference({
      id: "strategy-canvas",
      source: new URL("./references/strategy-canvas.md", import.meta.url),
      target: "references/strategy-canvas.md",
      title: "strategy-canvas.md",
      summary: "策略画布方法：识别竞争因子、价值曲线和差异化空间。",
      loadWhen: "需要把行业竞争因子可视化，并找出脱离红海竞争的价值曲线时读取。",
    }),
    defineReference({
      id: "errc-grid",
      source: new URL("./references/errc-grid.md", import.meta.url),
      target: "references/errc-grid.md",
      title: "errc-grid.md",
      summary: "ERRC 四动作框架：剔除、降低、提高、创造。",
      loadWhen: "需要把蓝海战略转成具体产品、服务、成本或体验调整时读取。",
    }),
    defineReference({
      id: "non-customers",
      source: new URL("./references/non-customers.md", import.meta.url),
      target: "references/non-customers.md",
      title: "non-customers.md",
      summary: "非顾客三层分析：近端非顾客、拒绝者和未开发市场。",
      loadWhen: "需要从非顾客视角寻找新需求空间或重新定义目标市场时读取。",
    }),
    defineReference({
      id: "space-matrix",
      source: new URL("./references/space-matrix.md", import.meta.url),
      target: "references/space-matrix.md",
      title: "space-matrix.md",
      summary: "SPACE 矩阵（战略态势定位）的分析方法和应用指南。",
      loadWhen: "需要使用 SPACE 矩阵评估战略态势或补充 SWOT 的外部环境分析时读取。",
    }),
  ],
});
