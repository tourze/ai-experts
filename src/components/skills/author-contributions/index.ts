import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const authorContributionsSkill = defineSkill({
  id: "author-contributions",
  fullName: "作者贡献追踪",
  description: "当用户要查看某个作者在分支上的提交、diff、文件归属、贡献统计或回答“谁改了什么”时使用。",
  useCases: [
    "用户要看某个作者在当前分支相对 `main` 或其他上游分支的真实贡献面。",
    "需要区分“作者直接修改了这个文件”和“作者改的是旧路径，后来被别人 rename 到当前路径”。",
    "合并前要核对作者实际涉及的落地文件，而不是只看 commit 数量。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
