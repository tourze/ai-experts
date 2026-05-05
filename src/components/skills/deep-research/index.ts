import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const deepResearchSkill = defineSkill({
  id: "deep-research",
  description: "当需要联网做事实研究、概念解释、竞品比较、趋势梳理或基于外部信息的前置调研时使用；涉及中文平台数据生态（微信公众号、抖音、大众点评、微博、B 站、小红书等）需要按母公司归属判断主源时也用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for deep-research.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
