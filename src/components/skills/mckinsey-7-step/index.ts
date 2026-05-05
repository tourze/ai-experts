import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const mckinseyStepSkill = defineSkill({
  id: "mckinsey-7-step",
  fullName: "麦肯锡七步成诗法",
  description: "当用户要系统性解决复杂业务问题、做咨询式分析或结构化拆解方案时使用。简单选择题或已知答案的确认性提问不适用。",
  useCases: [
    "面对模糊的业务问题，需要结构化拆解到可执行方案。",
    "咨询式问题解决：从假设出发，用数据验证。",
    "与 [first-principles-decomposer](../first-principles-decomposer/SKILL.md) 配合：第一性原理拆假设，七步法走全流程。",
  ],
  constraints: [
    "七步是循环不是直线——假设不成立时必须退回重来。",
    "**步骤 2（分解问题）是成败关键**：MECE 原则必须严格遵守（相互独立、完全穷举）。",
    "步骤 3（确定关键问题）用 80/20 法则聚焦 2-3 个关键驱动因素，不是面面俱到。",
    "**假设驱动**：先假设后验证，不是先收集所有数据再总结。没有假设的分析 = 没有方向 = 信息过载。",
    "最终方案必须有金字塔结构（结论先行），不是流水账。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
