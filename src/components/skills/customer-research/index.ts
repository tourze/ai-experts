import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  constraints: [
    "结论必须有原始引用支撑，禁止凭空编造 persona。",
    "每次明确当前模式：分析已有素材 vs. 在线挖掘。",
    "所有洞察标注置信度（高/中/低）和样本量。",
    "文案任务改用 `copywriting`；页面优化改用 `page-cro`；竞品分析配合 `competitive-teardown`。",
  ],
  checklist: [
    "明确了当前模式（素材分析 / 在线挖掘）。",
    "每条洞察附原始引用或来源。",
    "标注了置信度等级。",
    "样本覆盖目标细分群体。",
    "Persona 从数据构建。",
    "标记了矛盾点和研究缺口。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "凭空编造 persona",
      pass: "数据驱动",
    }),
    defineAntiPattern({
      fail: "只看好评",
      pass: "全谱覆盖",
    }),
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
      summary: "从访谈记录、评论、工单和 NPS 回复中系统提炼洞察的框架方法。",
      loadWhen: "需要从原始用户反馈中提取结构化洞察、分类主题或标注置信度时读取。",
    }),
    defineReference({
      id: "persona-template",
      source: new URL("./references/persona-template.md", import.meta.url),
      target: "references/persona-template.md",
      title: "persona-template.md",
      summary: "基于真实数据构建用户 persona 的模板与字段说明。",
      loadWhen: "需要将研究数据转化为可用的 persona 描述或 JTBD 地图时读取。",
    }),
  ],
});
