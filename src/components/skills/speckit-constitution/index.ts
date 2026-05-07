import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitConstitutionSkill = defineSkill({
  id: "speckit-constitution",
  fullName: "Speckit Constitution",
  description: "当用户要创建或更新项目宪章、Source of Law、原则版本或模板流程约束时使用。",
  useCases: [
    "当用户要创建或更新项目宪章、Source of Law、原则版本或模板流程约束时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "读取宪章模板，识别占位符（如 `[PROJECT_NAME]`）。",
      "根据用户输入和仓库上下文填充内容。",
      `按语义版本规则更新版本号：
   - MAJOR：原则被重定义/移除
   - MINOR：新增原则或明显扩展
   - PATCH：文字澄清`,
      `同步检查并更新：
   - \`.specify/templates/plan-template.md\`
   - \`.specify/templates/spec-template.md\`
   - \`.specify/templates/tasks-template.md\``,
      "在宪章头部输出变更摘要（版本、原则变更、影响面）。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "更新后的宪章",
      "同步影响列表",
    ],
  }),
  tools: [],
});
