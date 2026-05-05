import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const featureDevSkill = defineSkill({
  id: "feature-dev",
  fullName: "feature-dev",
  description: "当用户要实现跨多文件、跨模块或存在架构取舍的新功能时使用。单文件小改或纯 bug 修复不需要。",
  useCases: [
    "适合复杂功能、陌生代码库、新模块建设和需要沉淀文档的功能开发。",
    "适合把一次实现拆成可解释的阶段，而不是直接跳进编码。",
    "交叉引用：设计前风险审计用 `plan-review`；拆任务时配合 `task-decomposer`；跨 session 的复杂任务配合 `persistent-planning` 落盘三文件。",
  ],
  constraints: [
    "不要跳阶段，尤其不能跳过代码库探索、澄清问题和方案对比。",
    "实现阶段必须带验证策略，必要时先补测试再写代码。",
    "如果只是单行修复或紧急热修，不要强行套满七阶段。",
    "总结阶段要记录关键决策、限制和后续动作。",
  ],
  checklist: [
    "是否明确定义了功能目标、成功标准和范围边界。",
    "是否识别了相关文件、既有模式和相似实现。",
    "是否补齐了关键澄清问题和方案对比。",
    "是否在收尾阶段记录已知限制和后续改进项。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
