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
  constraints: [
    "默认数据源是 GitHub 公开仓库；若没有额外说明，不假定用户提供 token。",
    "默认硬过滤：`stars >= 100`、`archived = false`、公开仓库。",
    "如果用户已经明确给出主题、数量、排序偏好和门槛，可以直接执行；若这些信息缺失，再补最少澄清。",
    "`stars` 是门槛，不应该成为唯一排序依据；结果必须综合相关性、活跃度和工程成熟度。",
    "每个推荐项都要回答两件事：“它是什么”“为什么在当前目标下值得推荐”。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
