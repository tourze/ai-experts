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

export const ghFixCiSkill = defineSkill({
  id: "gh-fix-ci",
  description: "当用户要求排查或修复 GitHub Actions PR 检查失败时使用；先用 gh 获取失败上下文，再在获批后实施修复。",
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
      id: "inspect-pr-checks",
      entry: new URL("./scripts/inspect_pr_checks.mjs", import.meta.url),
      target: "scripts/inspect_pr_checks.mjs",
      runtime: "node",
      bundle: false,
      description: "Script inspect_pr_checks.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "create-github-action-workflow-specification",
      source: new URL("./references/create-github-action-workflow-specification.md", import.meta.url),
      target: "references/create-github-action-workflow-specification.md",
      title: "create-github-action-workflow-specification.md",
      summary: "Reference material for gh-fix-ci.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gh-address-comments",
      source: new URL("./references/gh-address-comments.md", import.meta.url),
      target: "references/gh-address-comments.md",
      title: "gh-address-comments.md",
      summary: "Reference material for gh-fix-ci.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for gh-fix-ci.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "github-small",
      source: new URL("./assets/github-small.svg", import.meta.url),
      target: "assets/github-small.svg",
    }),
    defineAsset({
      id: "github",
      source: new URL("./assets/github.png", import.meta.url),
      target: "assets/github.png",
    })
  ],
});
