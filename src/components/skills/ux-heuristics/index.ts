import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { uxResearcherDesignerSkill } from "../ux-researcher-designer/index";

export const uxHeuristicsSkill = defineSkill({
  id: "ux-heuristics",
  fullName: "UX Heuristics",
  description: "当用户需要诊断界面可用性问题或做启发式评估时使用（交互层：导航混乱、表单阻塞、信息架构复盘）。产品策略级设计审视用 `product-design-critic`；UI 实现质量审查用 `frontend-design-review`。",
  useCases: [
    "用户反馈“找不到入口”“不知道系统在干什么”“提交后没反应”。",
    "需要在没有真实用户测试前，先做一轮低成本可用性体检。",
    "要给页面、流程、组件输出可执行的严重级别与修复顺序。",
    "发现问题已经超出视觉层，需结合 `ux-researcher-designer` 一起处理。",
    "具体评估细则优先读取 [Nielsen 十原则](references/nielsen-heuristics.md)、[Krug 导航检查](references/krug-principles.md) 与 [审计模板](references/audit-template.md)。",
  ],
  constraints: [
    "先描述任务目标、用户上下文和阻塞行为，再给结论；不要只给“界面不好看”。",
    "每个问题必须同时给出 `heuristic`、`severity(0-4)`、`evidence`、`recommendation`。",
    "视觉问题只有在影响任务完成、理解成本或信任时，才归入启发式问题。",
    "明显的启发式错误先直接修，不要拿 A/B 测试替代基础可用性修复。",
    "涉及诱导、误导、强制续费等模式时，必须交叉检查 [暗黑模式参考](references/dark-patterns.md)。",
    "涉及对比度、焦点状态、键盘访问时，必须交叉检查 [WCAG 清单](references/wcag-checklist.md)。",
  ],
  checklist: [
    "页面一眼能回答“我在哪、能做什么、下一步是什么”。",
    "关键操作都有即时状态反馈，且不会诱发重复点击。",
    "导航、按钮、表单标签使用用户语言，不使用内部术语。",
    "错误提示包含“发生了什么、为什么、怎么恢复”。",
    "重要流程存在撤销、返回或安全退出路径。",
    "移动端没有 hover-only 信息和过小触控区。",
    "同一个概念在不同页面命名一致。",
    "需要国际化时已检查 [文化与本地化约束](references/cultural-ux.md)。",
  ],
  relatedSkills: [
    {
      get id() {
        return uxResearcherDesignerSkill.id;
      },
      reason: "发现问题已经超出视觉层，需结合 `ux-researcher-designer` 一起处理。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "audit-template",
      source: new URL("./references/audit-template.md", import.meta.url),
      target: "references/audit-template.md",
      title: "audit-template.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "cultural-ux",
      source: new URL("./references/cultural-ux.md", import.meta.url),
      target: "references/cultural-ux.md",
      title: "cultural-ux.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dark-patterns",
      source: new URL("./references/dark-patterns.md", import.meta.url),
      target: "references/dark-patterns.md",
      title: "dark-patterns.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "heuristic-conflicts",
      source: new URL("./references/heuristic-conflicts.md", import.meta.url),
      target: "references/heuristic-conflicts.md",
      title: "heuristic-conflicts.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "krug-principles",
      source: new URL("./references/krug-principles.md", import.meta.url),
      target: "references/krug-principles.md",
      title: "krug-principles.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "nielsen-heuristics",
      source: new URL("./references/nielsen-heuristics.md", import.meta.url),
      target: "references/nielsen-heuristics.md",
      title: "nielsen-heuristics.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "wcag-checklist",
      source: new URL("./references/wcag-checklist.md", import.meta.url),
      target: "references/wcag-checklist.md",
      title: "wcag-checklist.md",
      summary: "Reference material for ux-heuristics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
