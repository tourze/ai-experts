import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillParameter,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先调用 `speckit-baseline` skill 完成 `.specify/` 初始化，完成后回到本流程。",
      "运行：`node .specify/scripts/check-prerequisites.mjs --json --paths-only`",
      `读取当前 \`spec.md\`，按以下维度打标：清晰/部分清晰/缺失。
   - 角色与目标
   - 数据模型与状态变化
   - 异常与边界处理
   - 非功能要求（性能/安全/可观测性）`,
      "只提出最多 5 个、且“答案会改变实现方案”的问题。",
      "收到用户答复后，写回 `spec.md` 对应章节。",
      "若用户拒绝澄清，记录风险并允许继续。",
    ],
  }),
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
});
