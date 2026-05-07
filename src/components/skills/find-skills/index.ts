import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const findSkillsSkill = defineSkill({
  id: "find-skills",
  fullName: "Find Skills",
  description: "当用户要查找适合任务的 skill、询问如何做某类工作或是否存在相关 skill 时使用。已知 skill 名称直接调用时不需要。",
  useCases: [
    "用户问「怎么做 X」且 X 可能是已有 skill 覆盖的常见任务。",
    "用户说「找一个 X 的 skill」或「有没有 X 的 skill」。",
    "用户问「你能做 X 吗」且 X 是特定领域能力。",
    "用户表达想扩展 agent 能力。",
    "用户想搜索工具、模板或工作流。",
    "用户提到希望在某领域有更多帮助（设计、测试、部署等）。",
  ],
  constraints: [
    "不要仅凭搜索结果推荐 skill——先验证安装量和来源声誉。",
    "优先推荐 1K+ 安装量的 skill，对 <100 安装的保持警惕。",
    "优先官方来源（vercel-labs、anthropics、microsoft）。",
    "搜索无结果时不要沉默——给兜底方案或建议 `npx skills init`。",
    "执行时遵循正文中的流程和必要参考资料，不用未经验证的假设替代证据。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看搜索结果就推荐——第一个结果只有 5 个安装就「试试这个」。",
      pass: "验证安装量（≥1K）和来源，优先官方来源。",
    }),
    defineAntiPattern({
      fail: "搜索无结果就沉默——只说「没找到 skill」让用户卡住。",
      pass: "提供通用能力兜底 + 建议 `npx skills init` 为重复任务创建 skill。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先理解用户需要：领域、具体任务、是否是常见可复用工作流，以及是否已点名某个 skill。",
      "优先查 skills.sh leaderboard，判断是否已有高安装量、常见来源或官方维护的 skill。",
      "leaderboard 未覆盖时运行 `npx skills find <query>`，查询词包含领域和任务动词。",
      "推荐前验证安装量、来源声誉和源仓库活跃度；<100 安装量默认谨慎。",
      "给用户展示 skill 名称、用途、安装量、来源、安装命令和 skills.sh 链接。",
      "用户同意后再安装，可用 `npx skills add <owner/repo@skill> -g -y`；无结果时给通用兜底或建议 `npx skills init`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "搜索意图：领域、任务、关键词、是否已有本地 skill 和查询语句。",
      "候选 skill 表：名称、来源、安装量、repo 信号、适配理由、风险和安装命令。",
      "无结果兜底：通用处理建议、创建 skill 的触发条件和下一步。",
    ],
  }),
  references: [
    defineReference({
      id: "search-guide",
      source: new URL("./references/search-guide.md", import.meta.url),
      target: "references/search-guide.md",
      title: "search-guide.md",
      summary: "技能搜索的使用指南，包括搜索策略、过滤条件和结果解读。",
      loadWhen: "需要高效查找适合任务的 skill 或了解搜索功能使用方法时读取。",
    }),
    defineReference({
      id: "skills-cli-guide",
      source: new URL("./references/skills-cli-guide.md", import.meta.url),
      target: "references/skills-cli-guide.md",
      title: "Skills CLI 使用指南",
      summary: "Skills CLI 工具简介、常用命令和 skills.sh 浏览地址。",
      loadWhen: "需要了解 Skills CLI 基本用法或向用户介绍 skills 生态系统时读取。",
    }),
  ],
});
