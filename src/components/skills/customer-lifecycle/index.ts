import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const customerLifecycleSkill = defineSkill({
  id: "customer-lifecycle",
  fullName: "客户与产品生命周期",
  description: "当用户要做客户分层管理、CLV 分层、生命周期营销或产品生命周期阶段决策时使用。",
  useCases: [
    "客户价值分层：按 CLV / 利润贡献切层（铂金/金/铁/铅）。",
    "客户生命周期：从观望-激活-扩展-续约-赢回，按阶段定营销动作。",
    "产品 PLC：判断产品所处阶段（导入/成长/成熟/衰退），匹配策略与投入。",
    "与 `s-curve-growth` 配合：S 曲线看动力学，本 skill 看运营策略。",
  ],
  constraints: [
    "价值分层依据是**利润贡献（CLV）**，不是收入或频次。高收入低利润可能是铅层。",
    "铅层处理方案（提价 / 减服务 / 放弃）必须显式给出——不是所有客户都值得留。",
    "健康度三看：① 铂+金层利润占比 ② 铅层占比 ③ 层级流动性。",
    "产品 PLC 与客户生命周期是两条不同轴，分析时不要混用。",
    "不同阶段营销重点完全不同：用成熟期方法做导入期 = 浪费。",
  ],
  checklist: [
    "[ ] 分层依据是利润贡献（CLV），不是收入。",
    "[ ] 铅层有明确处理方案（不是忽略）。",
    "[ ] 做了金字塔健康度评估（头部依赖、铅层占比、流动性）。",
    "[ ] 准确判断了产品所处 PLC 阶段，策略与阶段匹配。",
    "[ ] 考虑了下一阶段过渡准备（成熟期前布局下一代）。",
    "[ ] 产品 PLC 与客户 LC 分别分析，没有混淆。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "strategy-matrix",
      source: new URL("./references/strategy-matrix.md", import.meta.url),
      target: "references/strategy-matrix.md",
      title: "strategy-matrix.md",
      summary: "Reference material for customer-lifecycle.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
