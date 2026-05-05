import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const customerLifecycleSkill = defineSkill({
  id: "customer-lifecycle",
  description: "当用户要做客户分层管理、CLV 分层、生命周期营销或产品生命周期阶段决策时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for customer-lifecycle.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
