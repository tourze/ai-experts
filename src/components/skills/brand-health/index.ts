import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const brandHealthSkill = defineSkill({
  id: "brand-health",
  fullName: "品牌健康度诊断",
  description: "当用户要诊断品牌健康度、评估品牌漏斗或判断品牌问题环节时使用。新品牌（<6 个月）或纯营销执行方案不适用。",
  useCases: [
    "定期品牌健康检查（季度/年度）。",
    "品牌重塑前的诊断。",
    "与 [content-strategy](../content-strategy/SKILL.md) 配合：品牌诊断找问题，内容策略做修复。",
  ],
  constraints: [
    "五维度漏斗：认知度 -> 美誉度 -> 使用率 -> 购买意愿 -> 推荐率（NPS）。",
    "漏斗越均匀 = 品牌越健康。某处突然收窄 = 该维度是瓶颈。",
    "**认知度高不等于品牌好**——虚名品牌（知道但不买）比低认知品牌更难修。",
    "四种品牌类型及对策：\n- 健康高认知（五维均衡高分）-> 维护\n- 传播缺乏（认知低但其他尚可）-> 加大曝光\n- 健康低认知（美誉高但认知低）-> 扩大触达\n- 虚名品牌（认知高但购买/推荐低）-> 改善产品体验",
    "每个维度要有对标数据（行业均值或竞品），单独看没有意义。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
