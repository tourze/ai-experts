import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { docCoauthoringSkill } from "../doc-coauthoring/index";
import { markdownMermaidWritingSkill } from "../markdown-mermaid-writing/index";
import { mdToPdfSkill } from "../md-to-pdf/index";
import { pptGenerateSkill } from "../ppt-generate/index";
import { userGuideWritingSkill } from "../user-guide-writing/index";

export const tutorialBuilderSkill = defineSkill({
  id: "tutorial-builder",
  fullName: "Tutorial Builder",
  description: "当用户要把主题、笔记、URL、论文或仓库材料做成有来源支撑的完整教程、课程讲义或学习包，并需要章节视觉与 DOCX/PDF/HTML 导出规划时使用。",
  useCases: [
    "用户要从主题、零散笔记、URL、论文、仓库、课程材料或草稿生成完整教程。",
    "交付目标是学习包：`brief`、研究记录、教程大纲、正文、章节视觉、练习、来源附录和导出计划。",
    "需要权威来源支撑，而不是无来源博客、短答或普通操作手册。",
    "只写终端用户的产品操作指南时，转 `user-guide-writing`；只协作文档结构时，先用 `doc-coauthoring`。",
  ],
  constraints: [
    "用户材料优先：先保留用户的意图、角度、案例、术语和排除项，再补外部来源。",
    "外部研究按强度分层：官方/标准/论文优先，其次 GitHub/实现证据，再到专家讨论和二级解释。",
    "教程必须是学习路径，不是链接摘要；每章回答一个学习问题并配一个视觉说明。",
    "默认正文长度是完整教程：中文 `5000-10000` 字，英文 `3500-7000` words；用户要求 sample/brief 时再降级。",
    "DOCX/PDF/HTML 以 Markdown 正文为 canonical source，不维护三份不同内容。",
  ],
  checklist: [
    "已分类用户材料，并说明 rich / moderate / thin 研究等级。",
    "每章都有 source IDs、视觉说明、练习和 checkpoint。",
    "重要事实有官方、论文、实现或可追溯来源支撑。",
    "用户材料足够强时，它是教程主线；外部研究只补缺口。",
    "导出格式以同一份 Markdown 为源，DOCX/PDF/HTML 没有内容分叉。",
  ],
  relatedSkills: [
    {
      get id() {
        return mdToPdfSkill.id;
      },
      reason: "5. 以 Markdown 为源规划 DOCX/PDF/HTML 导出；具体转换分别衔接 `docx`、`md-to-pdf`。",
    },
    {
      get id() {
        return markdownMermaidWritingSkill.id;
      },
      label: "pretty-mermaid",
      reason: "需要渲染 Mermaid 成品图时衔接 `pretty-mermaid`；需要演示视觉规范时衔接 `ppt-visual`。",
    },
    {
      get id() {
        return pptGenerateSkill.id;
      },
      label: "ppt-visual",
      reason: "需要渲染 Mermaid 成品图时衔接 `pretty-mermaid`；需要演示视觉规范时衔接 `ppt-visual`。",
    },
    {
      get id() {
        return userGuideWritingSkill.id;
      },
      reason: "只写终端用户的产品操作指南时，转 `user-guide-writing`；只协作文档结构时，先用 `doc-coauthoring`。",
    },
    {
      get id() {
        return docCoauthoringSkill.id;
      },
      reason: "只写终端用户的产品操作指南时，转 `user-guide-writing`；只协作文档结构或 DOCX 交付边界时，先用 `doc-coauthoring`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "链接摘要伪装成教程",
      pass: "来源变成学习路径",
    }),
    defineAntiPattern({
      fail: "三份导出三份内容",
      pass: "Markdown 单一来源",
    }),
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
      summary: "教程交付物包的结构定义，包括大纲、正文、视觉、练习、来源附录和导出格式规划。",
      loadWhen: "需要确定教程交付物的完整结构和各模块的内容要求时读取。",
    }),
  ],
});
