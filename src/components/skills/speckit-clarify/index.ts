import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitClarifySkill = defineSkill({
  id: "speckit-clarify",
  fullName: "Speckit Clarify",
  description: "当用户要识别 spec.md 中的关键歧义、补齐验收边界或通过澄清问答更新规格时使用。",
  useCases: [
    "当用户要识别 spec.md 中的关键歧义、补齐验收边界或通过澄清问答更新规格时使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
