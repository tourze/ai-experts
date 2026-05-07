import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "“建议优化体验”",
      pass: "具体任务失败点",
    }),
    defineAntiPattern({
      fail: "“用户教育”掩盖",
      pass: "改标签不教用户",
    }),
    defineAntiPattern({
      fail: "二次确认代替撤销",
      pass: "撤销 + 延迟",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用启发式原则诊断界面和流程可用性问题，输出带证据、严重级别和修复顺序的可执行审计结果。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先明确任务目标、用户上下文、阻塞行为和要评估的页面/流程/组件范围。",
      "每条发现必须包含 heuristic、severity(0-4)、evidence 和 recommendation；基础审计格式读取 audit-template。",
      "导航和信息架构优先读 Krug，通用可用性读 Nielsen；冲突取舍读 heuristic-conflicts。",
      "暗黑模式、可访问性和本地化分别读取 dark-patterns、wcag-checklist、cultural-ux；代码落地前可用关键字搜索状态、错误和导航命名。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "结构化审计 JSON 或 Markdown：score、summary、findings、severity、heuristic、evidence、recommendation。",
      "问题排序、修复优先级、可直接落地的标签/状态/导航/表单建议。",
      "需要进一步用户研究、可访问性修复或产品策略升级的边界说明。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "audit-template",
      source: new URL("./references/audit-template.md", import.meta.url),
      target: "references/audit-template.md",
      title: "audit-template.md",
      summary: "启发式评估审计模板，包括严重级别定义、发现问题记录格式和修复优先级排序。",
      loadWhen: "需要输出结构化的可用性审计报告时读取。",
    }),
    defineReference({
      id: "cultural-ux",
      source: new URL("./references/cultural-ux.md", import.meta.url),
      target: "references/cultural-ux.md",
      title: "cultural-ux.md",
      summary: "跨文化用户体验设计约束，包括语言、色彩、图标和交互习惯差异。",
      loadWhen: "需要做国际化或本地化产品的用户体验评估时读取。",
    }),
    defineReference({
      id: "dark-patterns",
      source: new URL("./references/dark-patterns.md", import.meta.url),
      target: "references/dark-patterns.md",
      title: "dark-patterns.md",
      summary: "常见暗黑模式类型清单，包括诱导、误导、强制续费和隐私陷阱。",
      loadWhen: "需要检查产品是否存在诱导或欺骗性设计模式时读取。",
    }),
    defineReference({
      id: "heuristic-conflicts",
      source: new URL("./references/heuristic-conflicts.md", import.meta.url),
      target: "references/heuristic-conflicts.md",
      title: "heuristic-conflicts.md",
      summary: "启发式原则之间的冲突场景分析与权衡方法。",
      loadWhen: "遇到多个启发式原则互相矛盾、需要优先取舍时读取。",
    }),
    defineReference({
      id: "krug-principles",
      source: new URL("./references/krug-principles.md", import.meta.url),
      target: "references/krug-principles.md",
      title: "krug-principles.md",
      summary: "Steve Krug 可用性原则，聚焦导航清晰度和用户认知负担。",
      loadWhen: "需要诊断导航混乱、信息架构不清或用户找不到入口时读取。",
    }),
    defineReference({
      id: "nielsen-heuristics",
      source: new URL("./references/nielsen-heuristics.md", import.meta.url),
      target: "references/nielsen-heuristics.md",
      title: "nielsen-heuristics.md",
      summary: "Jakob Nielsen 十条可用性启发式原则的详细解释与应用要点。",
      loadWhen: "需要按 Nielsen 十原则逐项评估界面可用性时读取。",
    }),
    defineReference({
      id: "wcag-checklist",
      source: new URL("./references/wcag-checklist.md", import.meta.url),
      target: "references/wcag-checklist.md",
      title: "wcag-checklist.md",
      summary: "WCAG 无障碍检查清单，覆盖对比度、焦点状态、键盘访问和屏幕阅读器支持。",
      loadWhen: "需要检查界面无障碍合规性或修复可访问性问题时读取。",
    }),
  ],
});
