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
