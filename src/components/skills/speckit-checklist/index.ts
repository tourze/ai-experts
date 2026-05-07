import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitChecklistSkill = defineSkill({
  id: "speckit-checklist",
  fullName: "Speckit Checklist",
  description: "当用户要为当前特性建立需求质量 checklist、验收问题或安全性能兼容性检查项时使用。",
  useCases: [
    "当用户要为当前特性建立需求质量 checklist、验收问题或安全性能兼容性检查项时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
    "条目必须单条可判定，避免模糊词；一条只检查一个维度；覆盖主流程、异常流程和边界条件。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    title: "核心原则",
    body: `清单是“需求文档的单元测试”，不是代码测试。

- 检查对象：完整性、可测性、一致性、可执行性
- 非检查对象：按钮是否可点击、接口是否返回 200（这是实现测试）`,
  }),
  workflow: defineSkillWorkflow({
    steps: [
      `读取上下文：
   - \`.specify/features/<feature>/spec.md\`
   - 若存在则读取 \`plan.md\`、\`tasks.md\``,
      "从用户输入提取关注域：安全、性能、可用性、兼容性、合规等。",
      "为每个关注域生成可判定条目（是/否）。",
      "输出到当前 feature 目录：`.specify/features/<feature>/checklists/requirements.md`。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出示例",
    body: `\`\`\`markdown
- [ ] 是否定义了失败重试次数与退避策略？
- [ ] 是否定义了权限不足时的用户可见反馈？
\`\`\``,
  }),
  tools: [],
});
