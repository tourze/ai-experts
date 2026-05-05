import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const authorContributionsSkill = defineSkill({
  id: "author-contributions",
  fullName: "作者贡献追踪",
  description: "当用户要查看某个作者在分支上的提交、diff、文件归属、贡献统计或回答“谁改了什么”时使用。",
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
      summary: "Eval cases for author-contributions.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
