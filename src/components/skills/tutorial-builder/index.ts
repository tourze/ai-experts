import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
    "需要区分完整教程、终端用户操作指南和纯文档协作。",
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
      get skill() {
        return mdToPdfSkill;
      },
      reason: "教程正文定稿后，需要以 Markdown 为源导出 PDF 时联动。",
    },
    {
      get skill() {
        return markdownMermaidWritingSkill;
      },
      reason: "章节视觉需要流程图、架构图、时间线或 Mermaid 图示时联动。",
    },
    {
      get skill() {
        return pptGenerateSkill;
      },
      reason: "教程需要转成演示材料、课程讲义或视觉规范 slide 时联动。",
    },
    {
      get skill() {
        return userGuideWritingSkill;
      },
      reason: "目标是终端用户操作指南、帮助中心或产品使用说明，而不是课程学习包时联动。",
    },
    {
      get skill() {
        return docCoauthoringSkill;
      },
      reason: "只需要协作文档结构、章节组织、审稿或 DOCX 交付边界时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先建立 brief：topic、audience、learning_goal、language、material_tier 和 output_formats；字段合同读取 tutorial-package-contract。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "判断用户材料等级 rich/moderate/thin，并据此控制外部研究预算；用户材料强时以其为主线。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "先写来源登记和 evidence map，再写大纲；不要边搜边写正文。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "每章包含学习目标、概念、视觉、例子、坑、练习、checkpoint 和 source IDs。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "章节视觉先写 visual-spec，明确 visual_type、learning_point、elements 和 caption，不直接堆装饰图。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "以 Markdown 正文作为 canonical source，再规划 DOCX/PDF/HTML 或演示材料导出。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "brief、材料等级、研究预算、来源登记、evidence map 和来源附录。",
      "教程大纲、章节正文、视觉规格、练习、checkpoint 和 source IDs。",
      "Markdown canonical source、导出计划、格式风险和需要联动的文档/图示/PDF/PPT skill。",
    ],
  }),
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
