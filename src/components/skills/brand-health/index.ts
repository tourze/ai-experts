import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { contentStrategySkill } from "../content-strategy/index";

export const brandHealthSkill = defineSkill({
  id: "brand-health",
  fullName: "品牌健康度诊断",
  description:
    "当用户要诊断品牌健康度、评估品牌漏斗或判断品牌问题环节时使用。新品牌（<6 个月）或纯营销执行方案不适用。",
  useCases: [
    "定期品牌健康检查（季度/年度）。",
    "品牌重塑前的诊断。",
    "与 `content-strategy` 配合：品牌诊断找问题，内容策略做修复。",
  ],
  constraints: [
    "五维度漏斗：认知度 -> 美誉度 -> 使用率 -> 购买意愿 -> 推荐率（NPS）。",
    "漏斗越均匀 = 品牌越健康。某处突然收窄 = 该维度是瓶颈。",
    "**认知度高不等于品牌好**——虚名品牌（知道但不买）比低认知品牌更难修。",
    "四种品牌类型及对策：\n- 健康高认知（五维均衡高分）-> 维护\n- 传播缺乏（认知低但其他尚可）-> 加大曝光\n- 健康低认知（美誉高但认知低）-> 扩大触达\n- 虚名品牌（认知高但购买/推荐低）-> 改善产品体验",
    "每个维度要有对标数据（行业均值或竞品），单独看没有意义。",
    "不适用场景：新品牌（< 6 个月）还没有足够市场数据做五维评估，先聚焦产品和获客。",
  ],
  checklist: [
    "五个维度都有数据或定性判断。",
    "有对标（竞品或行业均值）。",
    "找到了漏斗收窄点。",
    "品牌类型判断准确，对策匹配。",
  ],
  relatedSkills: [
    {
      get id() {
        return contentStrategySkill.id;
      },
      reason: "与 `content-strategy` 配合：品牌诊断找问题，内容策略做修复。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "认知度 = 品牌力",
      pass: "漏斗诊断",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用认知度、美誉度、使用率、购买意愿和推荐率五维漏斗定位品牌瓶颈，并匹配修复策略。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "确认品牌阶段、目标市场、竞品/行业对标和可用数据；新品牌或数据不足时先说明不适用。",
      "依次评估认知度、美誉度、使用率、购买意愿和推荐率（NPS），每一项都绑定证据或定性依据。",
      "找出漏斗突然收窄的维度，并判断是传播缺乏、健康低认知、虚名品牌还是健康高认知。",
      "把品牌类型映射到策略：维护、加大曝光、扩大触达或改善产品体验。",
      "输出优先修复动作、指标、对标差距和需要 `content-strategy` 承接的内容任务。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "五维品牌漏斗和对标数据。",
      "漏斗瓶颈与品牌类型判断。",
      "匹配策略、优先动作和责任指标。",
      "证据缺口、假设和后续调研。",
    ],
  }),
  tools: [],
});
