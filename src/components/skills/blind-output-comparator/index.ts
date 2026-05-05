import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const blindOutputComparatorSkill = defineSkill({
  id: "blind-output-comparator",
  fullName: "Blind Output Comparator",
  description: "当用户要盲评两个输出版本、比较 A/B 结果质量、生成任务专属 rubric 或避免偏向某个 skill/模型/实现时使用。",
  useCases: [
    "有两个标记为 A / B 的输出，需要判断哪个更好完成原始任务。",
    "需要根据任务动态生成 rubric，而不是套固定评分表。",
    "expectations 可用但不完整，需要同时看整体质量和断言通过率。",
    "两个输出都失败或都不错时，需要选择“失败更轻”或“边际更好”的一方。",
  ],
  constraints: [
    "保持盲评：不要推断 A / B 来自哪个 skill、模型或作者。",
    "主要依据是任务完成度和输出质量；expectations 只是次要证据。",
    "Rubric 必须由原始任务生成，至少覆盖内容质量和结构可用性两类。",
    "除非两个输出确实等价，否则要果断选择 A 或 B；平局应少见。",
    "reasoning 必须具体说明胜者强在哪里、败者差在哪里。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
