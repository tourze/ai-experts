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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
