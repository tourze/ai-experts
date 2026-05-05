import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const preLandingReviewSkill = defineSkill({
  id: "pre-landing-review",
  fullName: "落地前审查",
  description: "当用户需要判断代码是否可以合并或上线时使用。适用于 pre-merge review、gate check、上线前安全检查等请求。",
  useCases: [
    "用户要判断当前分支或指定 diff 是否可以合并。",
    "关注的是“会不会出事故”，不是一般性的代码美学讨论。",
    "需要围绕数据安全、并发、信任边界、测试缺口做阻断级判断。",
    "需要与 [testing-strategy](../testing-strategy/SKILL.md) 配合，决定哪些风险必须补测后才能放行。",
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
      id: "collect-diff",
      entry: new URL("./scripts/collect_diff.mjs", import.meta.url),
      target: "scripts/collect_diff.mjs",
      runtime: "node",
      bundle: false,
      description: "Script collect_diff.mjs.",
    }),
    defineSkillScript({
      id: "render-report",
      entry: new URL("./scripts/render_report.mjs", import.meta.url),
      target: "scripts/render_report.mjs",
      runtime: "node",
      bundle: false,
      description: "Script render_report.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "checklist",
      source: new URL("./references/checklist.md", import.meta.url),
      target: "references/checklist.md",
      title: "checklist.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scripts-workflow",
      source: new URL("./references/scripts-workflow.md", import.meta.url),
      target: "references/scripts-workflow.md",
      title: "scripts-workflow.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
