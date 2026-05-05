import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitSpecifySkill = defineSkill({
  id: "speckit-specify",
  fullName: "Speckit Specify",
  description: "当用户要把自然语言需求转成 spec.md、更新特性规格、用户故事或验收标准时使用。",
  useCases: [
    "当用户要把自然语言需求转成 spec.md、更新特性规格、用户故事或验收标准时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
