import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const refactoringChecklistSkill = defineSkill({
  id: "refactoring-checklist",
  fullName: "重构前安全检查清单",
  description: "当用户要重构、重组或清理代码，需要从流程纪律保证安全性和增量推进时使用。本 skill 只管「流程门禁」（测试基线、范围界定、回滚方案），不教具体重构手法。",
  useCases: [
    "用户要对现有代码做结构调整、抽取、合并、移动职责。",
    "用户觉得代码\"很乱\"想整理但没想清楚具体做什么。",
    "本 skill 只回答「能不能开始 / 怎么安全推进 / 怎么回滚」。",
    "交叉引用：\n- 具体「该用哪个重构手法」（Extract Method / 异味分类）→ `architecture-expert/refactoring-patterns`。\n- 降低嵌套与函数复杂度的诊断 → `complexity-reducer`。\n- 审查结论触发的重构 → `code-review`。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "重构 = 改结构不改行为。行为变更（bug 修复、新功能）必须另开提交。",
    "没有测试覆盖的代码，先补表征测试再重构。",
    "每步保持系统可运行、测试可通过。",
    "范围必须提前确定，防止\"顺手改\"扩散。",
  ],
  checklist: [
    "有测试覆盖（或已补表征测试）",
    "范围已界定，排除项已明确",
    "在干净分支上操作，每步提交",
    "重构提交不混入行为变更",
    "重构后覆盖率不低于基线",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "重构搭车",
      pass: "三类独立提交",
    }),
    defineAntiPattern({
      fail: "大爆炸提交",
      pass: "增量小步",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "incremental-actions",
      source: new URL("./references/incremental-actions.md", import.meta.url),
      target: "references/incremental-actions.md",
      title: "incremental-actions.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pre-checks",
      source: new URL("./references/pre-checks.md", import.meta.url),
      target: "references/pre-checks.md",
      title: "pre-checks.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "refactor-loop",
      source: new URL("./references/refactor-loop.dot", import.meta.url),
      target: "references/refactor-loop.dot",
      title: "refactor-loop.dot",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
