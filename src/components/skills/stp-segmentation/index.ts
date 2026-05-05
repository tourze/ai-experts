import {
  InvocationPolicy,
  KnownTool,
  Platform,
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
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
