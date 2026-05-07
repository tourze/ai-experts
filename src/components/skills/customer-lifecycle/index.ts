import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { bcgMatrixSkill } from "../bcg-matrix/index";
import { designingGrowthLoopsSkill } from "../designing-growth-loops/index";

export const customerLifecycleSkill = defineSkill({
  id: "customer-lifecycle",
  fullName: "客户与产品生命周期",
  description: "当用户要做客户分层管理、CLV 分层、生命周期营销或产品生命周期阶段决策时使用。",
  useCases: [
    "客户价值分层：按 CLV / 利润贡献切层（铂金/金/铁/铅）。",
    "客户生命周期：从观望-激活-扩展-续约-赢回，按阶段定营销动作。",
    "产品 PLC：判断产品所处阶段（导入/成长/成熟/衰退），匹配策略与投入。",
    "与 `designing-growth-loops` 配合：增长阶段和 S 曲线看动力学，本 skill 看运营策略。",
  ],
  constraints: [
    "价值分层依据是**利润贡献（CLV）**，不是收入或频次。高收入低利润可能是铅层。",
    "铅层处理方案（提价 / 减服务 / 放弃）必须显式给出——不是所有客户都值得留。",
    "健康度三看：① 铂+金层利润占比 ② 铅层占比 ③ 层级流动性。",
    "产品 PLC 与客户生命周期是两条不同轴，分析时不要混用。",
    "不同阶段营销重点完全不同：用成熟期方法做导入期 = 浪费。",
    "不适用场景：客户数 < 100 样本不足以分层；纯 PLG/自助产品用产品内分群；多产品组合资源分配转 `bcg-matrix`；增长拐点判断转 `designing-growth-loops`。",
  ],
  checklist: [
    "分层依据是利润贡献（CLV），不是收入。",
    "铅层有明确处理方案（不是忽略）。",
    "做了金字塔健康度评估（头部依赖、铅层占比、流动性）。",
    "准确判断了产品所处 PLC 阶段，策略与阶段匹配。",
    "考虑了下一阶段过渡准备（成熟期前布局下一代）。",
    "产品 PLC 与客户 LC 分别分析，没有混淆。",
  ],
  relatedSkills: [
    {
      get id() {
        return bcgMatrixSkill.id;
      },
      reason: "多产品组合资源分配、业务优先级排序或 BCG/GE 矩阵分析时联动。",
    },
    {
      get id() {
        return designingGrowthLoopsSkill.id;
      },
      reason: "需要判断增长阶段、S 曲线拐点或增长飞轮动力学时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认分析轴：客户价值分层、客户生命周期、产品 PLC，或三者组合，并明确数据来源和样本规模。",
      "按利润贡献/CLV 做客户分层，不用收入或频次替代；对铅层给出提价、减服务或放弃方案。",
      "判断客户生命周期阶段：观望、激活、扩展、续约、赢回，并匹配对应营销动作。",
      "判断产品 PLC 阶段：导入、成长、成熟、衰退，并保持它与客户生命周期分开分析。",
      "需要选择具体策略时读取 `strategy-matrix` reference，再评估铂金+金层利润占比、铅层占比和层级流动性。",
      "输出分层健康度、阶段策略、风险假设和下一步验证。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "客户价值分层与铅层处理方案。",
      "客户生命周期阶段判断和营销动作。",
      "产品 PLC 阶段判断、投入策略和下一阶段准备。",
      "健康度风险、关键假设和可验证下一步。",
    ],
  }),
  references: [
    defineReference({
      id: "strategy-matrix",
      source: new URL("./references/strategy-matrix.md", import.meta.url),
      target: "references/strategy-matrix.md",
      title: "strategy-matrix.md",
      summary: "客户分层、生命周期营销与产品 PLC 各阶段的策略矩阵对照。",
      loadWhen: "需要选择客户分层策略、确定生命周期营销动作或判断产品 PLC 阶段时读取。",
    }),
  ],
});
