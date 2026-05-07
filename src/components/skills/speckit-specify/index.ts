import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillParameter,
  defineSkillWorkflow,
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
    "默认在当前分支工作；禁止 `git checkout -b ...`、`git switch -c ...` 和 `node .specify/scripts/create-new-feature.mjs`，除非用户明确要求新分支。",
    "需求写“是什么/为什么”，避免实现细节；模糊项用 `[待澄清]`，最多 3 处。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "确保 `.specify/scripts` 与 `.specify/templates` 存在；若缺失，先调用 skill `speckit-baseline` 完成 `.specify/` 初始化（Claude Code: `/speckit-baseline`；Codex: `$speckit-baseline`），完成后回到本流程。",
      "从需求生成 `slug`（2-4 词，连字符）。",
      "在当前仓库创建或复用目录：`.specify/features/<slug>/`",
      `使用模板生成/更新：\`.specify/features/<slug>/spec.md\`
   - 模板来源：\`.specify/templates/spec-template.md\`（由步骤 1 的 bootstrap 拷入）。`,
      "在 feature 目录内同步创建/更新：`.specify/features/<slug>/checklists/requirements.md`。",
      `写入 \`.specify/feature.json\`，内容至少包含：
   - \`feature_directory: ".specify/features/<slug>"\``,
      "输出：feature 目录、spec 路径、待澄清项。",
    ],
  }),
  tools: [],
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
});
