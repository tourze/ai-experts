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
import { consultingAnalysisSkill } from "../consulting-analysis/index";

export const proposalWriterSkill = defineSkill({
  id: "proposal-writer",
  fullName: "提案撰写",
  description: "当用户要撰写商业提案、合作方案、销售报价说明、伙伴关系文档、企业级方案、RFP 响应或带 ROI 论证的咨询式材料时使用。该技能强调问题定义、价值主张、实施计划和成交导向的文字表达。",
  useCases: [
    "用户需要从零开始写商业提案、项目方案、渠道合作或服务报价文档。",
    "面向企业客户、采购方、管理层或投资委员会输出正式提案，覆盖 RFP 响应与 ROI 论证。",
    "目标是\"写出能发给客户的文本\"，不是只做提纲。",
    "交付物可以是长文档、Word 方案、PPT 结构稿或销售跟进材料。",
    "已经具备一部分背景材料，但需要把它们组织成对外表达。",
  ],
  constraints: [
    "必须围绕客户问题、目标和成交动作写作，不要把公司介绍写成主角。",
    "结构要完整：背景、问题、方案、价值、实施、商务条款。",
    "没有证据的业绩、案例、统计数字、节约金额不能写；案例和承诺按证据强弱分层。",
    "报价、范围、里程碑、假设与排除项必须成套出现，不能只写价格。",
    "文案要服务成交动作，例如预约评审、签试点、进入采购流程或签约节点。",
    "企业级提案要明确客户决策链、预算区间和采购阶段。",
  ],
  checklist: [
    "是否写清楚了客户当前问题、目标状态和价值主张。",
    "是否把交付物、节奏、责任边界和验收方式写完整。",
    "是否在报价之外给出版本方案、假设和排除项。",
    "是否包含明确 CTA，例如下一次会议、试点范围或签约步骤。",
    "在正式发送前，是否用 [proposal-review](references/proposal-review.md) 做过一次评审。",
  ],
  relatedSkills: [
    {
      get skill() {
        return consultingAnalysisSkill;
      },
      reason: "若前置研究还没完成，先用 `consulting-analysis` 补齐事实基础。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "公司宣传册",
      pass: "客户问题驱动",
    }),
    defineAntiPattern({
      fail: "形容词堆专业感",
      pass: "动词 + 数字",
    }),
    defineAntiPattern({
      fail: "一行总价",
      pass: "报价拆解 + 版本（适合企业级 / RFP 场景）",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认客户类型、合作目标、方案时长、必须包含项、决策链、预算区间和采购阶段。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "以客户问题和目标为主线组织背景、问题、方案、价值、实施、商务条款和下一步动作。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "案例、业绩、统计数字、节约金额和承诺必须有证据，按强弱分层表达。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "正式发送前读取 `proposal-review` 做结构、价值主张和成交动作评审。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "客户问题、目标状态、价值主张和方案摘要。",
      "里程碑、交付物、责任边界、验收方式、报价逻辑、假设和排除项。",
      "企业级决策链、CTA、下一步动作和发送前评审结论。",
    ],
  }),
  references: [
    defineReference({
      id: "proposal-review",
      source: new URL("./references/proposal-review.md", import.meta.url),
      target: "references/proposal-review.md",
      title: "proposal-review.md",
      summary: "商业提案评审清单，覆盖结构完整性、价值主张和成交动作检查。",
      loadWhen: "正式发送商业提案前需要做最终质量评审时读取。",
    }),
  ],
});
