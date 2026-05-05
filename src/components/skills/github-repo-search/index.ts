import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const githubRepoSearchSkill = defineSkill({
  id: "github-repo-search",
  description: "当用户要搜索 GitHub 开源项目、找某个方向的仓库或做可比较的仓库推荐时使用。",
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
      summary: "Eval cases for github-repo-search.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
