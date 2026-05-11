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
import { marketSizingAnalysisSkill } from "../market-sizing-analysis/index";

export const startupIcpDefinerSkill = defineSkill({
  id: "startup-icp-definer",
  fullName: "理想客户画像",
  description: "当用户要定义理想客户画像、购买中心、目标行业或关键 persona 时使用；帮助把“谁最值得卖”说清楚。",
  useCases: [
    "B2B/B2B2C 早期定位、销售聚焦、市场切入和外呼名单筛选。",
    "需要完整方法时可阅读 [references/full-guide.md](references/full-guide.md)。",
  ],
  constraints: [
    "ICP 必须同时覆盖公司画像、买方角色、使用者角色和购买触发因素。",
    "先找高痛点、高付费意愿、高成交概率的客户，而不是“最大的市场”。",
    "画像要服务销售和产品决策，不是堆一份漂亮的人设。",
  ],
  checklist: [
    "公司画像、买方画像和用户画像已区分。",
    "已说明触发事件、预算来源和典型异议。",
    "有“做什么客户”和“不做什么客户”两套标准。",
    "结果可直接指导销售名单、信息架构和路线图。",
  ],
  relatedSkills: [
    {
      get skill() {
        return marketSizingAnalysisSkill;
      },
      reason: "需要结合想法验证或市场空间时，可配合 `market-sizing-analysis`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "ICP = 所有人",
      pass: "窄而深",
    }),
    defineAntiPattern({
      fail: "只人口统计",
      pass: "加触发 + 痛点",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先收集现有客户、赢单/输单、销售管道、使用数据和创始人假设；资料不足时说明置信度。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "区分公司画像、买方角色、使用者角色和影响者，不把 persona 写成单一人设。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按痛点强度、付费意愿、成交概率、可触达性、部署复杂度和战略价值筛选候选 ICP。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "为每个候选 ICP 写清触发事件、预算来源、典型异议、成功信号和排除条件。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要完整方法时读取 `full-guide` reference；需要市场空间校验时联动 `market-sizing-analysis`。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "把 ICP 转成销售名单筛选规则、信息架构、产品路线图和不服务客户标准。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "公司画像、买方画像、用户画像和影响者地图。",
      "理想特征、排除条件、触发事件和典型异议表。",
      "候选 ICP 评分与优先级。",
      "销售名单规则、定位信息、产品路线图影响和下一步验证。",
    ],
  }),
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "理想客户画像（ICP）的完整定义方法，包含公司画像、买方角色和购买触发因素。",
      loadWhen: "需要系统性地定义理想客户画像或审查现有 ICP 完整性时读取。",
    }),
  ],
});
