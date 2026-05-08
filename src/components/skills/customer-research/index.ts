import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { competitiveIntelligenceSkill } from "../competitive-intelligence/index";
import { copywritingSkill } from "../copywriting/index";
import { croMethodologySkill } from "../cro-methodology/index";

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
    "文案任务改用 `copywriting`；页面优化改用 `cro-methodology`；竞品分析配合 `competitive-intelligence`。",
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
  relatedSkills: [
    {
      get id() {
        return copywritingSkill.id;
      },
      reason: "用户目标转为营销页面文案、价值主张、CTA 或落地页段落撰写时联动。",
    },
    {
      get id() {
        return croMethodologySkill.id;
      },
      reason: "用户目标转为页面转化诊断、CRO 实验假设或落地页优化时联动。",
    },
    {
      get id() {
        return competitiveIntelligenceSkill.id;
      },
      reason: "用户目标转为竞品情报、市场定位、battlecard 或竞品深拆时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先声明当前模式：分析已有素材或在线挖掘；输入可能是访谈转写、问卷开放题、客服工单、赢/丢单笔记、NPS 或公开评论。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "已有素材按 extraction-framework 提取 JTBD、痛点、触发事件、期望结果、原话词汇和替代方案，再做主题聚类、频率×强度打分和分群。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "在线挖掘先确定关键词和默认 12 个月窗口，逐条抽取角色、痛点、JTBD、原话、情绪极性，并跨渠道验证。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "置信度按来源数量和渠道交叉验证分高/中/低；样本不足或偏差明显时标为初步信号。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要 persona 或 JTBD 地图时读取 persona-template，所有画像必须回链到真实数据来源。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "结构化洞察：主题、JTBD、痛点、触发事件、期望结果、替代方案、原话和来源。",
      "置信度、样本量、样本偏差、矛盾点、研究缺口和时效窗口说明。",
      "基于真实数据的 persona、分群差异、金句摘录和可用于内容/产品/销售的行动建议。",
    ],
  }),
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
