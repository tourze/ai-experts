import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const deepResearchSkill = defineSkill({
  id: "deep-research",
  fullName: "深度研究",
  description: "当需要联网做事实研究、概念解释、竞品比较、趋势梳理或基于外部信息的前置调研时使用；涉及中文平台数据生态（微信公众号、抖音、大众点评、微博、B 站、小红书等）需要按母公司归属判断主源时也用。",
  useCases: [
    "用户明确要求“研究 / 调查 / 比较 / 解释”某个外部主题，且答案依赖联网信息。",
    "需要为报告、文章、方案、演示或内容创作准备事实基础。",
    "话题包含时效性、争议性或多视角信息，单次搜索不足以覆盖。",
    "如果用户已经给出具体 URL，先转到 [web-content-fetcher](../web-content-fetcher/SKILL.md) 抓正文。",
    "如果问题是”某个代码库里的 X 怎么工作”，不要用本 skill，用代码库分析工具。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chinese-platform-routing",
      source: new URL("./references/chinese-platform-routing.md", import.meta.url),
      target: "references/chinese-platform-routing.md",
      title: "chinese-platform-routing.md",
      summary: "Reference material for deep-research.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "knowledge-synthesis",
      source: new URL("./references/knowledge-synthesis.md", import.meta.url),
      target: "references/knowledge-synthesis.md",
      title: "knowledge-synthesis.md",
      summary: "Reference material for deep-research.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "technology-search",
      source: new URL("./references/technology-search.md", import.meta.url),
      target: "references/technology-search.md",
      title: "technology-search.md",
      summary: "Reference material for deep-research.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
