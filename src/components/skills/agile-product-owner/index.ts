import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { procedureUse, agileProductOwnerUserStoryGenerator } from "../../procedures/index";

import { createPrdSkill } from "../create-prd/index";

export const agileProductOwnerSkill = defineSkill({
  id: "agile-product-owner",
  fullName: "敏捷产品负责人",
  description: "当用户需要编写用户故事、补齐验收标准、拆分 Epic、规划 Sprint 或排序 Backlog 时使用。",
  useCases: [
    "把需求拆成可交付的用户故事、Epic 和 Sprint 范围。",
    "需要结合 [references/user-story-templates.md](references/user-story-templates.md)、[references/sprint-planning-guide.md](references/sprint-planning-guide.md) 或模板资产落文档。",
    "故事拆分可配合 `user-story-patterns`（8 种拆分模式 + INVEST 检查），Epic 分解可配合 `epic-decomposition`（9 种分解模式 + Story Mapping）。",
    "需要运行脚本生成示例 Backlog 或 Sprint 计划时，可直接调用 `procedure agile-product-owner-user-story-generator`。",
  ],
  constraints: [
    "先确认业务目标、角色、成功标准，再拆故事；单条 Story 应能在一个 Sprint 内完成。",
    "验收标准必须覆盖成功路径、失败路径和边界条件，避免“优化一下”这类不可验证表述。",
    "运行脚本时只使用已验证命令：`procedure agile-product-owner-user-story-generator` 与 `procedure agile-product-owner-user-story-generator sprint 30`；Sprint 容量必须是正整数。",
  ],
  checklist: [
    "用户角色、业务目标、非目标和依赖已经明确。",
    "Story 满足 INVEST，验收标准可直接转为测试用例。",
    "Sprint 承诺范围与容量匹配，Stretch 目标没有挤占 committed 范围。",
    "模板、参考资料与脚本参数保持一致。",
  ],
  relatedSkills: [
    {
      get id() {
        return createPrdSkill.id;
      },
      reason: "故事拆分可配合 `user-story-patterns`，Epic 分解可配合 `epic-decomposition`；这些模板归入 `create-prd` 相关资料。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Epic 当 Story",
      pass: "拆到 INVEST",
    }),
    defineAntiPattern({
      fail: "无边界需求",
      pass: "可测试 AC",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  procedures: [
    procedureUse(agileProductOwnerUserStoryGenerator),
  ],
  references: [
    defineReference({
      id: "pm-career-ladder",
      source: new URL("./references/pm-career-ladder.md", import.meta.url),
      target: "references/pm-career-ladder.md",
      title: "pm-career-ladder.md",
      summary: "产品经理职业发展阶梯：各级职责、能力要求与成长路径。",
      loadWhen: "需要评估 PM 角色分工或规划团队能力成长时读取。",
    }),
    defineReference({
      id: "sprint-planning-guide",
      source: new URL("./references/sprint-planning-guide.md", import.meta.url),
      target: "references/sprint-planning-guide.md",
      title: "sprint-planning-guide.md",
      summary: "Sprint 规划完整流程：容量估算、范围承诺与目标设定。",
      loadWhen: "需要规划 Sprint 范围或进行容量与承诺平衡时读取。",
    }),
    defineReference({
      id: "user-story-templates",
      source: new URL("./references/user-story-templates.md", import.meta.url),
      target: "references/user-story-templates.md",
      title: "user-story-templates.md",
      summary: "用户故事标准模板、验收条件格式与常见编写模式。",
      loadWhen: "需要编写用户故事或检查验收标准完整性时读取。",
    }),
    defineReference({
      id: "version-planner",
      source: new URL("./references/version-planner.md", import.meta.url),
      target: "references/version-planner.md",
      title: "version-planner.md",
      summary: "版本规划策略：Epic 分解、发布路线图与里程碑跟踪。",
      loadWhen: "需要制定版本发布计划或管理多 Sprint 交付路线时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "sprint-planning-template",
      source: new URL("./assets/sprint_planning_template.md", import.meta.url),
      target: "assets/sprint_planning_template.md",
    }),
    defineAsset({
      id: "user-story-template",
      source: new URL("./assets/user_story_template.md", import.meta.url),
      target: "assets/user_story_template.md",
    })
  ],
});
