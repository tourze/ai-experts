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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
