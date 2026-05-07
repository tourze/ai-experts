import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitStatusSkill = defineSkill({
  id: "speckit-status",
  fullName: "Speckit Status",
  description: "当用户要查看 Spec Kit 特性进度、完成度、阻塞项、缺失文件或下一步优先级时使用。",
  useCases: [
    "当用户要查看 Spec Kit 特性进度、完成度、阻塞项、缺失文件或下一步优先级时使用。",
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
      "扫描 `.specify/features/*`。",
      `对每个 feature 统计：
   - \`spec.md\` 是否存在
   - \`plan.md\` 是否存在
   - \`tasks.md\` 完成率（\`[x] / [ ] / [/]\`）
   - \`<feature>/checklists/requirements.md\` 完成率`,
      `标记阻塞项：
   - 待澄清标记
   - 缺关键文档
   - 长期未推进任务`,
      "输出看板与优先处理建议。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出格式",
    items: [
      "Speckit 状态看板列：Feature、阶段、完成度、阻塞。",
    ],
  }),
});
