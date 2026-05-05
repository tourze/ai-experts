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
  description: "当用户需要判断代码是否可以合并或上线时使用。适用于 pre-merge review、gate check、上线前安全检查等请求。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pre-landing-review.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
