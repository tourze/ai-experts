import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const researchNoteWrapSkill = defineSkill({
  id: "research-note-wrap",
  fullName: "调研结论笔记",
  description: "当用户要把当前调研或分析会话压成高密度 Markdown 结论笔记时使用。",
  useCases: [
    "调研、分析、技术选型、issue 排障会话末尾，把讨论沉淀成可复用的 Markdown 结论笔记。",
    "输入是「当前对话已经产出的判断与依据」，不是 git 提交、不是已有多源 retrieval、不是外部会议/电话转写。",
    "反场景路由：\n- coding 改完写 session journal → `session-finalization-workflow`\n- 已有多批检索结果做来源分层综合\n- 外部会议/电话转写 → `meeting-notes-and-actions`\n- 复盘本轮合作并沉淀经验 → `session-finalization-workflow`",
  ],
  constraints: [
    "中文优先；技术标识符保留英文原样。",
    "范围默认「当前会话」；仅在用户显式说「今天关于 xx 的相关会话」时扩展。",
    "**强制双步确认**：先对齐「主要问题」表 → 再对齐「核心结论」表 → 才允许落盘；任一阶段被驳回回到对应步骤重写。",
    "表格承担密度：问题对比、结论对比、（必要时）实现位点；其后才是 `## 关键结论` 编号列表，禁流水账。",
    "引用文件/函数/路径必须给出三件事：它做什么、为什么关键、如何支撑结论。",
    "输出位置先查项目记忆文件（`CLAUDE.md` / `AGENTS.md` / `MEMORY.md`）的\"调研笔记目录\"约定；未定义则首次询问，并建议写回记忆文件。",
    "文件名 `YYYY-MM-DD-<topic>.md`；topic 不明确用 `session-research`。",
    "用户后续说「再调研 xx 写入笔记」「补充分析 xx」**默认追加**到现有笔记 `## 追加专题：xx` 段，不另开新文件。",
    "表格列名对齐仓库 `CLAUDE.md` 的「证据点 / 方案对比 / 风险登记」口径，完整骨架见 [输出模板](references/output-template.md)。",
  ],
  checklist: [
    "范围已确定（current-session / today-topic-synthesis）。",
    "输出路径来自记忆文件或已与用户当面确认。",
    "主要问题表与核心结论表均已通过用户确认。",
    "表格承担密度，`## 关键结论` 紧随其后。",
    "引用的位点都给出了\"它做什么 / 为什么关键 / 如何支撑结论\"。",
    "文件名匹配 `YYYY-MM-DD-<topic>.md`。",
    "追加专题场景没有新建文件。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "单步落盘",
      pass: "双步确认后落盘",
    }),
    defineAntiPattern({
      fail: "流水账叙事",
      pass: "表格承担密度",
    }),
    defineAntiPattern({
      fail: "干甩 path:line",
      pass: "三件事都到位",
    }),
    defineAntiPattern({
      fail: "错触发",
      pass: "转手到 meeting-notes-and-actions",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先决定范围：默认 current-session，只有用户显式给出“今天 + 主题”才走 today-topic-synthesis。",
      "读取记忆文件确认输出目录；未定义则先询问，并建议写回记忆文件。",
      "先草拟主要问题表等待确认，再草拟核心结论表和关键结论编号列表等待确认。",
      "确认后套用 `output-template` 落盘；引用位点前读取 `citation-validator`，反模式检查读 `anti-patterns`。",
      "跨会话第一版不自动检索 transcript，由用户提供具体会话或要点，并在 frontmatter 标注来源。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "主要问题表、核心结论表、关键结论编号列表和必要实现位点表。",
      "输出绝对路径、文件名 `YYYY-MM-DD-<topic>.md` 和 source frontmatter。",
      "追加专题段落、引用三件事完整性和用户确认记录。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "调研笔记常见反模式：单步落盘、流水账、干甩路径与错触发的详细案例。",
      loadWhen: "需要判断调研笔记是否违反反模式规则或查看反模式对照示例时读取。",
    }),
    defineReference({
      id: "citation-validator",
      source: new URL("./references/citation-validator.md", import.meta.url),
      target: "references/citation-validator.md",
      title: "citation-validator.md",
      summary: "引用验证器：检查文件/函数/路径引用是否完整描述了做什么、为什么关键与如何支撑结论。",
      loadWhen: "需要在笔记中引用代码位置时确认三件事是否都到位，或验证引用完整性时读取。",
    }),
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "调研笔记的 Markdown 输出模板：问题对比表、结论对比表与关键结论编号列表的骨架。",
      loadWhen: "需要开始撰写调研笔记或参考标准输出格式时读取。",
    }),
  ],
});
