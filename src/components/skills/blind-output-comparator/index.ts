import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineAntiPattern,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const blindOutputComparatorSkill = defineSkill({
  id: "blind-output-comparator",
  fullName: "Blind Output Comparator",
  description:
    "当用户要盲评两个输出版本、比较 A/B 结果质量、生成任务专属 rubric 或避免偏向某个 skill/模型/实现时使用。",
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
  checklist: [
    "已读取两个输出的完整内容；输出为目录时检查所有相关文件。",
    "已从原始任务提炼应产出什么、质量维度是什么、失败标准是什么。",
    "Rubric 同时覆盖 correctness / completeness / accuracy 和 organization / formatting / usability。",
    "如有 expectations，已统计通过率，但没有用它替代整体判断。",
    "winner 为 `A`、`B` 或 `TIE`，且 reasoning 足以复核。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "按来源偏好选择：盲评阶段不允许使用来源信息。",
      pass: "只按输出本身比较",
    }),
    defineAntiPattern({
      fail: "固定 rubric 不看任务：代码修复、PDF 填表、研究报告需要完全不同的质量维度。",
      pass: "任务专属 rubric",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "盲评两个输出版本，基于原始任务生成任务专属 rubric，并选择质量更高或失败更轻的一方。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先读取原始任务、expectations 和 A/B 输出完整内容；输出是目录时检查所有相关文件。",
      "保持盲评，不推断来源、模型、作者或实现路径；根据任务生成专属 rubric。",
      "Rubric 同时覆盖内容正确性、完整性、准确性、结构、格式和可用性；expectations 只作为次要证据。",
      "除非确实等价，否则选择 A 或 B，并具体说明胜者强在哪里、败者差在哪里。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "JSON 盲评结果，包含 `winner`、`reasoning`、任务专属 `rubric` 和 `output_quality`。",
      "A/B 的 strengths、weaknesses、content/structure/overall score 和 expectations 通过率。",
      "如果 TIE，说明为什么等价以及仍需人工决策的维度。",
    ],
  }),
  tools: [],
});
