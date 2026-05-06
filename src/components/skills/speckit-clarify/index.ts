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
  constraints: [
    "不要泛问；问题必须具体可回答。",
    "每次澄清应附带“影响范围”。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  parameters: [
    { name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" },
  ],
  argumentHint: "[用户输入]",
});
