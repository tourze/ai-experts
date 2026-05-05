import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitValidateSkill = defineSkill({
  id: "speckit-validate",
  fullName: "Speckit Validate",
  description: "当用户要验证实现是否满足规格、计划、任务、验收标准或边界条件时使用。",
  useCases: [
    "当用户要验证实现是否满足规格、计划、任务、验收标准或边界条件时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
