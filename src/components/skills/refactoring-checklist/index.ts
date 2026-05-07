import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { codeReviewSkill } from "../code-review/index";
import { complexityReducerSkill } from "../complexity-reducer/index";
import { refactoringPatternsSkill } from "../refactoring-patterns/index";

export const refactoringChecklistSkill = defineSkill({
  id: "refactoring-checklist",
  fullName: "重构前安全检查清单",
  description: "当用户要重构、重组或清理代码，需要从流程纪律保证安全性和增量推进时使用。本 skill 只管「流程门禁」（测试基线、范围界定、回滚方案），不教具体重构手法。",
  useCases: [
    "用户要对现有代码做结构调整、抽取、合并、移动职责。",
    "用户觉得代码\"很乱\"想整理但没想清楚具体做什么。",
    "本 skill 只回答「能不能开始 / 怎么安全推进 / 怎么回滚」。",
    "需要把重构和行为变更分开，建立测试基线、范围边界和回滚方案。",
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
  relatedSkills: [
    {
      get id() {
        return refactoringPatternsSkill.id;
      },
      reason: "已经满足流程门禁，需要选择 Extract Method、Move Method 或异味对应手法时联动。",
    },
    {
      get id() {
        return complexityReducerSkill.id;
      },
      reason: "重构目标是降低过长函数、深层嵌套、复杂条件或认知复杂度时联动。",
    },
    {
      get id() {
        return codeReviewSkill.id;
      },
      reason: "重构触发来自代码审查发现，或完成后需要审查结构质量时联动。",
    },
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先做准入四项：测试基线、范围界定、目标明确、回滚方案。",
      "没有可信测试覆盖时先补表征测试；行为变更、bug 修复和重构必须分开提交。",
      "按小步修改、跑测试、提交、重复的循环推进，每步保持系统可运行且可回滚。",
      "准入、增量循环和纪律守卫读取 `refactor-safety-workflow`；具体检查项和 DOT 流程读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "能否开始重构的准入结论、测试基线和范围排除项。",
      "增量步骤、验证命令、提交边界和回滚方案。",
      "行为变更混入、大爆炸提交、覆盖率下降等风险提示。",
    ],
  }),
  references: [
    defineReference({
      id: "refactor-safety-workflow",
      source: new URL("./references/refactor-safety-workflow.md", import.meta.url),
      target: "references/refactor-safety-workflow.md",
      title: "重构安全工作流",
      summary: "重构前准入四项、增量步骤循环、纪律守卫和常见偷步风险。",
      loadWhen: "需要判断能否开始重构、制定安全推进方式或解释重构纪律时读取。",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "重构纪律守卫：不允许违反红线规则的灵活变通解释与具体场景示例。",
      loadWhen: "需要判断重构方案是否违反纪律规则或解释为何必须严格遵守时读取。",
    }),
    defineReference({
      id: "incremental-actions",
      source: new URL("./references/incremental-actions.md", import.meta.url),
      target: "references/incremental-actions.md",
      title: "incremental-actions.md",
      summary: "重构增量动作序列：小步提交、可运行状态的保持与回滚具体操作步骤。",
      loadWhen: "需要设计或执行具体的增量重构步骤序列时读取。",
    }),
    defineReference({
      id: "pre-checks",
      source: new URL("./references/pre-checks.md", import.meta.url),
      target: "references/pre-checks.md",
      title: "pre-checks.md",
      summary: "重构开始前的前置检查：测试基线建立、范围界定与回滚方案的具体检查项。",
      loadWhen: "需要执行重构前安全检查或确认是否能安全开始重构时读取。",
    }),
    defineReference({
      id: "refactor-loop",
      source: new URL("./references/refactor-loop.dot", import.meta.url),
      target: "references/refactor-loop.dot",
      title: "refactor-loop.dot",
      summary: "重构循环 DOT 图：描述测试→修改→验证→提交的完整迭代流程。",
      loadWhen: "需要可视化重构流程或向团队说明重构工作方式时读取。",
    }),
  ],
});
