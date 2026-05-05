import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
      summary: "Reference material for hierarchical-matching-systems.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "decision-guide",
      source: new URL("./references/decision-guide.md", import.meta.url),
      target: "references/decision-guide.md",
      title: "decision-guide.md",
      summary: "Reference material for hierarchical-matching-systems.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
