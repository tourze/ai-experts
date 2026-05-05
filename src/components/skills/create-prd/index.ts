import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { agileProductOwnerSkill } from "../agile-product-owner/index";
import { prfaqSkill } from "../prfaq/index";

export const createPrdSkill = defineSkill({
  id: "create-prd",
  fullName: "编写 PRD",
  description: "当用户需要撰写或重构 PRD、功能规格说明或需求文档、做 Epic 分解、按 INVEST 编写用户故事或 MVP 范围取舍时使用。",
  useCases: [
    "新功能立项、需求收敛、跨团队对齐、进入开发前的规格固化。",
    "需要把 discovery 结论转成可执行需求时，可配合 `agile-product-owner`。",
    "如果还在验证阶段，先用 `prfaq` 定\"为什么做\"，再用 PRD 定\"怎么做\"。",
    "PRD 拆解执行：Epic 分解策略见 [references/epic-decomposition.md](references/epic-decomposition.md)，用户故事编写见 [references/user-story-patterns.md](references/user-story-patterns.md)，MVP 范围取舍见 [references/scoping-cutting.md](references/scoping-cutting.md)。",
  ],
  constraints: [
    "先写问题、目标和用户，再写方案；没有成功指标的 PRD 不完整。",
    "文档必须显式列出边界、非目标、风险与依赖，避免把所有诉求都塞进首版。",
    "PRD 是约束开发的事实来源，不是营销稿；措辞要可验证、可拆任务、可测试。",
    "10 段结构可根据项目规模裁剪，但 1-5 段为最小完整集，不可省略。",
  ],
  checklist: [
    "[ ] 问题、目标、用户、成功指标已闭环。",
    "[ ] 关键流程、状态变化、异常路径和边界条件已写清。",
    "[ ] 已明确非目标、依赖、上线方式与回滚预案。",
    "[ ] 后续可直接拆成版本规划和开发任务。",
  ],
  relatedSkills: [
    {
      get id() {
        return prfaqSkill.id;
      },
      reason: "如果还在验证阶段，先用 `prfaq` 定\\\\\\\"为什么做\\\\\\\"，再用 PRD 定\\\\\\\"怎么做\\\\\\\"。",
    },
    {
      get id() {
        return agileProductOwnerSkill.id;
      },
      reason: "需要把 discovery 结论转成可执行需求时，可配合 `agile-product-owner`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "epic-decomposition-patterns",
      source: new URL("./references/epic-decomposition-patterns.md", import.meta.url),
      target: "references/epic-decomposition-patterns.md",
      title: "epic-decomposition-patterns.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "epic-decomposition",
      source: new URL("./references/epic-decomposition.md", import.meta.url),
      target: "references/epic-decomposition.md",
      title: "epic-decomposition.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scoping-cutting",
      source: new URL("./references/scoping-cutting.md", import.meta.url),
      target: "references/scoping-cutting.md",
      title: "scoping-cutting.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scoping-guest-insights",
      source: new URL("./references/scoping-guest-insights.md", import.meta.url),
      target: "references/scoping-guest-insights.md",
      title: "scoping-guest-insights.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "user-story-invest-checklist",
      source: new URL("./references/user-story-invest-checklist.md", import.meta.url),
      target: "references/user-story-invest-checklist.md",
      title: "user-story-invest-checklist.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "user-story-patterns",
      source: new URL("./references/user-story-patterns.md", import.meta.url),
      target: "references/user-story-patterns.md",
      title: "user-story-patterns.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "user-story-splitting-patterns",
      source: new URL("./references/user-story-splitting-patterns.md", import.meta.url),
      target: "references/user-story-splitting-patterns.md",
      title: "user-story-splitting-patterns.md",
      summary: "Reference material for create-prd.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
