import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitReviewerSkill = defineSkill({
  id: "speckit-reviewer",
  fullName: "Speckit Reviewer",
  description: "当用户要审查 Spec Kit 实现代码、变更 diff、缺陷风险、安全问题或测试缺口时使用。",
  useCases: [
    "当用户要审查 Spec Kit 实现代码、变更 diff、缺陷风险、安全问题或测试缺口时使用。",
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
      `确定审查范围：
   - 指定文件 / staged / 当前分支变更`,
      `审查维度：
   - 正确性
   - 安全性
   - 性能
   - 可维护性
   - 测试覆盖`,
      `问题分级：
   - \`CRITICAL\` / \`HIGH\` / \`MEDIUM\` / \`LOW\``,
      `每条问题需包含：
   - 文件与位置
   - 风险说明
   - 最小修复建议`,
    ],
  }),
  outputs: defineSkillOutputs({
    body: "先列问题，再给简要总结与残余风险。",
  }),
  tools: [],
});
