import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const gitlabCiPatternsSkill = defineSkill({
  id: "gitlab-ci-patterns",
  fullName: "GitLab CI/CD 模式",
  description: "当用户要设计、优化或排查 GitLab CI/CD 流水线时使用。",
  useCases: [
    "新建或重构 `.gitlab-ci.yml`。",
    "优化多阶段流水线的执行顺序、缓存和制品传递。",
    "设计从构建到部署的 GitLab Runner 流程。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
