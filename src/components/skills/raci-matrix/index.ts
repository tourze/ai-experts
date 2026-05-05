import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const raciMatrixSkill = defineSkill({
  id: "raci-matrix",
  description: "当用户要用 RACI/RASCI 明确角色分工、职责归属、审批流程或责任矩阵时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for raci-matrix.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
