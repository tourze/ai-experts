import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const hierarchicalMatchingSystemsSkill = defineSkill({
  id: "hierarchical-matching-systems",
  fullName: "hierarchical-matching-systems",
  description: "在设计、评审或排查层级匹配系统时使用，适用于稳定匹配、最优分配、实体解析、分班分组或岗位匹配等场景。",
  useCases: [
    "适合学生分班、岗位匹配、组织树映射、分层分类归并、记录链接等问题。",
    "适合把业务规则翻译成可执行约束、偏好和目标函数。",
    "交叉引用：更大范围的架构边界用 `system-design`；问题审计用 `architecture-reviewer`（启用 Exhaustive 模式）。",
  ],
  constraints: [
    "先判断问题类型：稳定匹配、最优分配、层级对齐还是实体解析。",
    "业务约束、硬约束、软约束和优先级必须分开建模。",
    "任何“匹配质量差”结论都要落到具体输入分布、规则冲突或评分函数。",
    "不要把求解器选择和业务正确性混为一谈。",
  ],
  checklist: [
    "是否把输入实体、层级关系和约束表述清楚。",
    "是否区分了必须满足的约束和可优化目标。",
    "是否用样例解释匹配失败或不稳定现象。",
    "是否说明求解复杂度和可扩展性限制。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只谈算法",
      pass: "业务约束建模",
    }),
    defineAntiPattern({
      fail: "不做样本验证",
      pass: "样本验证",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "algorithms",
      source: new URL("./references/algorithms.md", import.meta.url),
      target: "references/algorithms.md",
      title: "algorithms.md",
      summary: "层级匹配系统的核心算法：稳定匹配、最优分配与实体解析的实现模式。",
      loadWhen: "需要选择或实现层级匹配问题的具体算法时读取。",
    }),
    defineReference({
      id: "decision-guide",
      source: new URL("./references/decision-guide.md", import.meta.url),
      target: "references/decision-guide.md",
      title: "decision-guide.md",
      summary: "层级匹配方案选型决策：问题分类、求解器选择与约束建模指南。",
      loadWhen: "需要判断匹配问题类型或选择求解方案时读取。",
    }),
  ],
});
