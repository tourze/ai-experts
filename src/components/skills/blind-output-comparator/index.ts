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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
