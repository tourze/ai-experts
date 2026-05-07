import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { designingGrowthLoopsSkill } from "../designing-growth-loops/index";
import { portersFiveForcesSkill } from "../porters-five-forces/index";

export const bcgMatrixSkill = defineSkill({
  id: "bcg-matrix",
  fullName: "BCG 矩阵（波士顿矩阵 + GE-McKinsey 九宫格）",
  description: "当用户要用 BCG/GE 矩阵做产品组合分析、业务优先级排序或资源分配决策时使用。",
  useCases: [
    "多产品/多业务线公司的资源分配、投资优先级排序。",
    "默认 BCG 2x2 快速分类；需要更精细的多维评估时切到 GE-McKinsey 九宫格模式（见下文）。",
  ],
  constraints: [
    "**相对**市场份额：对标最大竞品，不是绝对数字。分界线按行业调——SaaS 的\"高增长\"和制造业完全不同，不要默认 10%/1.0。",
    "问题象限是唯一需要 Go/No-Go 选择的——给窗口期 + 里程碑，到期不达标就砍。",
    "全投 = 没决策。BCG 的核心价值是**强迫取舍**。",
    "最终输出必须包含资源流向：现金牛 →→ 明星 + 被选中的问题业务，瘦狗 → 退出释放资源。",
    "不适用场景：缺乏行业数据时 GE 模式权重设定不可靠，退回到 BCG 2x2 快速分类。",
  ],
  checklist: [
    "相对市场份额是对比最大竞品，不是绝对数字。",
    "分界线设定有行业依据。",
    "问题业务做了选择（不能全投也不能全砍）。",
    "给出了明确的资源流向建议。",
    "用 GE 模式时：指标权重有行业依据（不是平均分配），内外部维度至少各 5 个指标，九宫格定位转化为具体战略动作。",
  ],
  relatedSkills: [
    {
      get id() {
        return portersFiveForcesSkill.id;
      },
      reason: "评估外部竞争：BCG/GE 看内部组合，不看行业结构。用 `porters-five-forces`。",
    },
    {
      get id() {
        return designingGrowthLoopsSkill.id;
      },
      label: "s-curve-growth",
      reason: "单产品公司：BCG/GE 都是多业务组合工具。用 `s-curve-growth` 判断生命阶段。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "所有业务都是明星",
      pass: "敢砍敢投",
    }),
    defineAntiPattern({
      fail: "GE 模式所有指标权重一样",
      pass: "GE 模式行业化权重",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认分析对象是多产品/多业务组合，并收集每条业务的市场增长、相对份额、利润贡献、资源占用和战略价值。",
      "默认用 BCG 2x2 分类：明星、现金牛、问题、瘦狗；相对市场份额必须对比最大竞品。",
      "对问题业务做 Go/No-Go：给窗口期、里程碑、投入上限和到期砍掉条件。",
      "当 2x2 太粗、需要多指标量化时读取 `ge-mckinsey-mode` reference，切到 GE-McKinsey 九宫格。",
      "用 GE 模式时分别评估市场吸引力和竞争实力，权重必须反映行业关键成功因素，不能平均分配。",
      "输出资源流向：现金牛支持明星和被选中的问题业务，瘦狗退出释放资源。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "业务组合清单、数据口径和关键假设。",
      "BCG 2x2 或 GE-McKinsey 九宫格定位。",
      "每个业务的投资、维持、试验、收缩或退出建议。",
      "资源流向、窗口期、里程碑和复审条件。",
    ],
  }),
  references: [
    defineReference({
      id: "ge-mckinsey-mode",
      source: new URL("./references/ge-mckinsey-mode.md", import.meta.url),
      target: "references/ge-mckinsey-mode.md",
      title: "GE-McKinsey 九宫格模式",
      summary: "BCG 2x2 过粗时使用的 GE-McKinsey 多指标加权方法、行业权重示例和交叉验证规则。",
      loadWhen: "需要量化打分、多指标组合评估，或 BCG 2x2 分类分歧较大时读取。",
    }),
  ],
});
