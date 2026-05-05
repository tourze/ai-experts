import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const customerResearchSkill = defineSkill({
  id: "customer-research",
  fullName: "客户研究（customer-research）",
  description: "当用户要做客户研究、VOC 分析、用户访谈提炼、评论挖掘或构建 persona 时使用（市场视角：购买决策、市场规模 persona）。设计视角的 UX 研究用 `ux-researcher-designer`；旅程图触点分析用 `customer-journey-map`。",
  useCases: [
    "有访谈记录、问卷、工单或 NPS 回复，需要系统提炼洞察。",
    "从 Reddit、G2、Capterra、HN、App Store 等渠道挖掘用户声音。",
    "基于真实数据构建 persona 或 JTBD 地图。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "extraction-framework",
      source: new URL("./references/extraction-framework.md", import.meta.url),
      target: "references/extraction-framework.md",
      title: "extraction-framework.md",
      summary: "Reference material for customer-research.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "persona-template",
      source: new URL("./references/persona-template.md", import.meta.url),
      target: "references/persona-template.md",
      title: "persona-template.md",
      summary: "Reference material for customer-research.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
