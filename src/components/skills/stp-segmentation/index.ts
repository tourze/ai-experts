import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const stpSegmentationSkill = defineSkill({
  id: "stp-segmentation",
  fullName: "STP 市场细分-目标-定位",
  description: "当用户要做 STP 市场细分、选择目标市场、制定市场定位或回答\"该卖给谁\"时使用。",
  useCases: [
    "新产品上市前确定\"卖给谁、怎么卖、怎么说\"。",
    "从\"什么都想做\"收敛到\"聚焦哪个细分市场\"。",
    "与 `startup-icp-definer` 配合：ICP 定画像，STP 定市场。",
  ],
  constraints: [
    "S -> T -> P 是顺序关系：先分再选再定位，**不能跳步**。没有细分就没有定位。",
    "细分必须可衡量、可进入、有规模、可区分、可操作——五个标准缺一不可。",
    "定位不是想出来的，是基于细分和竞争分析**选出来的**。",
    "定位主张必须用一句话说清楚，格式：\"对于[目标客户]，[产品]是[类别]中能够[核心利益]的产品，不同于[竞品]，我们的[差异化依据]\"。",
    "目标市场选择三种策略：无差异（全市场）、差异化（多个细分）、集中（专注一个）。大多数创业公司应该选集中策略。",
    "不适用场景：已有明确 ICP 时跳过 STP 直接做定位；纯 B2B 大客户（< 50 个潜在客户）市场太小，直接做 ABM。",
  ],
  checklist: [
    "S -> T -> P 按顺序完成，没有跳步。",
    "细分维度至少用了 2 个。",
    "目标市场有明确选择标准和理由。",
    "定位主张是一句话，且有差异化依据。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳过 S 直接定位",
      pass: "逐步收敛",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
