import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const refactoringChecklistSkill = defineSkill({
  id: "refactoring-checklist",
  description: "当用户要重构、重组或清理代码，需要从流程纪律保证安全性和增量推进时使用。本 skill 只管「流程门禁」（测试基线、范围界定、回滚方案），不教具体重构手法。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "incremental-actions",
      source: new URL("./references/incremental-actions.md", import.meta.url),
      target: "references/incremental-actions.md",
      title: "incremental-actions.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pre-checks",
      source: new URL("./references/pre-checks.md", import.meta.url),
      target: "references/pre-checks.md",
      title: "pre-checks.md",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "refactor-loop",
      source: new URL("./references/refactor-loop.dot", import.meta.url),
      target: "references/refactor-loop.dot",
      title: "refactor-loop.dot",
      summary: "Reference material for refactoring-checklist.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for refactoring-checklist.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
