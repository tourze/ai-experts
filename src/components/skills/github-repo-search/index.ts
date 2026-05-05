import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const githubRepoSearchSkill = defineSkill({
  id: "github-repo-search",
  fullName: "GitHub 仓库搜索",
  description: "当用户要搜索 GitHub 开源项目、找某个方向的仓库或做可比较的仓库推荐时使用。",
  useCases: [
    "用户还没锁定具体仓库，只知道方向，例如 agent memory、RAG、浏览器自动化、工作流引擎。",
    "需要给出可比较、可决策的 Top N 仓库榜单，而不是一堆散链接。",
    "若用户已经锁定某个仓库并要做深入拆解，使用代码库深度分析工具。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
