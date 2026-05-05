import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tutorialBuilderSkill = defineSkill({
  id: "tutorial-builder",
  fullName: "Tutorial Builder",
  description: "当用户要把主题、笔记、URL、论文或仓库材料做成有来源支撑的完整教程、课程讲义或学习包，并需要章节视觉与 DOCX/PDF/HTML 导出规划时使用。",
  useCases: [
    "用户要从主题、零散笔记、URL、论文、仓库、课程材料或草稿生成完整教程。",
    "交付目标是学习包：`brief`、研究记录、教程大纲、正文、章节视觉、练习、来源附录和导出计划。",
    "需要权威来源支撑，而不是无来源博客、短答或普通操作手册。",
    "只写终端用户的产品操作指南时，转 [user-guide-writing](../user-guide-writing/SKILL.md)；只协作文档结构时，先用 [doc-coauthoring](../doc-coauthoring/SKILL.md)。",
  ],
  constraints: [
    "用户材料优先：先保留用户的意图、角度、案例、术语和排除项，再补外部来源。",
    "外部研究按强度分层：官方/标准/论文优先，其次 GitHub/实现证据，再到专家讨论和二级解释。",
    "教程必须是学习路径，不是链接摘要；每章回答一个学习问题并配一个视觉说明。",
    "默认正文长度是完整教程：中文 `5000-10000` 字，英文 `3500-7000` words；用户要求 sample/brief 时再降级。",
    "DOCX/PDF/HTML 以 Markdown 正文为 canonical source，不维护三份不同内容。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "tutorial-package-contract",
      source: new URL("./references/tutorial-package-contract.md", import.meta.url),
      target: "references/tutorial-package-contract.md",
      title: "tutorial-package-contract.md",
      summary: "Reference material for tutorial-builder.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
