import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const agileProductOwnerSkill = defineSkill({
  id: "agile-product-owner",
  fullName: "敏捷产品负责人",
  description: "当用户需要编写用户故事、补齐验收标准、拆分 Epic、规划 Sprint 或排序 Backlog 时使用。",
  useCases: [
    "把需求拆成可交付的用户故事、Epic 和 Sprint 范围。",
    "需要结合 [references/user-story-templates.md](references/user-story-templates.md)、[references/sprint-planning-guide.md](references/sprint-planning-guide.md) 或模板资产落文档。",
    "故事拆分可配合 [user-story-patterns](../create-prd/SKILL.md)（8 种拆分模式 + INVEST 检查），Epic 分解可配合 [epic-decomposition](../create-prd/SKILL.md)（9 种分解模式 + Story Mapping）。",
    "需要运行脚本生成示例 Backlog 或 Sprint 计划时，可直接调用 `scripts/user_story_generator.mjs`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "user-story-generator",
      entry: new URL("./scripts/user_story_generator.mjs", import.meta.url),
      target: "scripts/user_story_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script user_story_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "pm-career-ladder",
      source: new URL("./references/pm-career-ladder.md", import.meta.url),
      target: "references/pm-career-ladder.md",
      title: "pm-career-ladder.md",
      summary: "Reference material for agile-product-owner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sprint-planning-guide",
      source: new URL("./references/sprint-planning-guide.md", import.meta.url),
      target: "references/sprint-planning-guide.md",
      title: "sprint-planning-guide.md",
      summary: "Reference material for agile-product-owner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "user-story-templates",
      source: new URL("./references/user-story-templates.md", import.meta.url),
      target: "references/user-story-templates.md",
      title: "user-story-templates.md",
      summary: "Reference material for agile-product-owner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "version-planner",
      source: new URL("./references/version-planner.md", import.meta.url),
      target: "references/version-planner.md",
      title: "version-planner.md",
      summary: "Reference material for agile-product-owner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
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
