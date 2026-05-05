import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
