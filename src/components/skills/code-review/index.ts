import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const codeReviewSkill = defineSkill({
  id: "code-review",
  fullName: "代码审查",
  description: "当用户要求审查代码质量、发现命名或职责问题、检查错误处理和边界情况时使用。支持标准/高压两档强度——高压模式由 brutal-honesty-review 合并而来。",
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
      id: "assess-code",
      entry: new URL("./scripts/assess-code.mjs", import.meta.url),
      target: "scripts/assess-code.mjs",
      runtime: "node",
      bundle: false,
      description: "Script assess-code.mjs.",
    }),
    defineSkillScript({
      id: "assess-tests",
      entry: new URL("./scripts/assess-tests.mjs", import.meta.url),
      target: "scripts/assess-tests.mjs",
      runtime: "node",
      bundle: false,
      description: "Script assess-tests.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "brutal-mode",
      source: new URL("./references/brutal-mode.md", import.meta.url),
      target: "references/brutal-mode.md",
      title: "brutal-mode.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dimensions",
      source: new URL("./references/dimensions.md", import.meta.url),
      target: "references/dimensions.md",
      title: "dimensions.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "health-score",
      source: new URL("./references/health-score.md", import.meta.url),
      target: "references/health-score.md",
      title: "health-score.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "receiving-code-review",
      source: new URL("./references/receiving-code-review.md", import.meta.url),
      target: "references/receiving-code-review.md",
      title: "receiving-code-review.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for code-review.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
