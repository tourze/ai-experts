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
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
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
