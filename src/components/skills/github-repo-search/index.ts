import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  checklist: [
    "信息不全时，是否只补必要澄清，而不是机械阻塞整个流程。",
    "是否生成了多组 query，而不是只搜一个词。",
    "是否记录检索时间、过滤规则和排序依据。",
    "是否完成去重、硬过滤、噪音剔除和类型分类。",
    "是否每个推荐项都写清“是什么 + 为什么推荐”。",
    "是否在结论里明确下一步：继续缩小范围，还是转入深度分析深挖单仓库。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只按 stars 排",
      pass: "综合排序",
    }),
    defineAntiPattern({
      fail: "不分类型",
      pass: "角色标签",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "围绕一个开源方向设计多组 GitHub 查询，召回、去重、过滤、重排并交付可决策的仓库推荐榜单。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先收敛输入：主题、Top N、最低 stars、排序模式和目标形态；缺失时只做必要澄清。",
      "设计 5-10 组查询，每组写明目的，例如高召回核心主题、补同义词盲区、框架/产品/工具服务分支。",
      "每组 query 抓 30-50 个候选，按 owner/repo 去重并应用默认或用户指定硬过滤。",
      "记录检索时间、过滤规则、配额状态和排序依据，保证结果可复现。",
      "按需求相关性、场景适配、活跃度、工程成熟度、license、示例和 stars 综合重排。",
      "给每个仓库打角色标签：通用框架、应用产品、基础设施、MCP/工具服务、目录清单、方法论/研究。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "查询计划：主题、Top N、门槛、排序偏好、目标形态和 5-10 组 query。",
      "过滤与重排记录：检索时间、去重、硬过滤、噪音剔除、排序依据和配额状态。",
      "推荐表：仓库、星标、类型、是什么、为什么推荐、补充信息、链接和下一步深度分析建议。",
    ],
  }),
  tools: [],
});
