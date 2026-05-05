import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const gitlabCiPatternsSkill = defineSkill({
  id: "gitlab-ci-patterns",
  fullName: "GitLab CI/CD 模式",
  description: "当用户要设计、优化或排查 GitLab CI/CD 流水线时使用。",
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
      summary: "Eval cases for gitlab-ci-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
