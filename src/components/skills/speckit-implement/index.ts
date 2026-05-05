import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitImplementSkill = defineSkill({
  id: "speckit-implement",
  fullName: "Speckit Implement",
  description: "当用户要依据 tasks.md 执行实现、逐项验证任务状态或控制规格驱动交付回归风险时使用。",
  useCases: [
    "当用户要依据 tasks.md 执行实现、逐项验证任务状态或控制规格驱动交付回归风险时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
