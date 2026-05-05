import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const gitAdvancedWorkflowsSkill = defineSkill({
  id: "git-advanced-workflows",
  description: "当需要 rebase、cherry-pick、bisect、worktree、reflog 或从 Git 误操作中恢复时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for git-advanced-workflows.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
