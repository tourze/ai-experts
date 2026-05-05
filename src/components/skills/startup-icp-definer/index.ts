import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { marketSizingAnalysisSkill } from "../market-sizing-analysis/index";

export const startupIcpDefinerSkill = defineSkill({
  id: "startup-icp-definer",
  fullName: "理想客户画像",
  description: "当用户要定义理想客户画像、购买中心、目标行业或关键 persona 时使用；帮助把“谁最值得卖”说清楚。",
  useCases: [
    "B2B/B2B2C 早期定位、销售聚焦、市场切入和外呼名单筛选。",
    "需要完整方法时可阅读 [references/full-guide.md](references/full-guide.md)。",
    "需要结合想法验证或市场空间时，可配合 `market-sizing-analysis`。",
  ],
  constraints: [
    "ICP 必须同时覆盖公司画像、买方角色、使用者角色和购买触发因素。",
    "先找高痛点、高付费意愿、高成交概率的客户，而不是“最大的市场”。",
    "画像要服务销售和产品决策，不是堆一份漂亮的人设。",
  ],
  relatedSkills: [
    {
      get id() {
        return marketSizingAnalysisSkill.id;
      },
      reason: "需要结合想法验证或市场空间时，可配合 `market-sizing-analysis`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Reference material for startup-icp-definer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
