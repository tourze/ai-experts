import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "citation-validator",
      source: new URL("./references/citation-validator.md", import.meta.url),
      target: "references/citation-validator.md",
      title: "citation-validator.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "Reference material for research-note-wrap.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
