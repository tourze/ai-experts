import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const bcgMatrixSkill = defineSkill({
  id: "bcg-matrix",
  description: "当用户要用 BCG/GE 矩阵做产品组合分析、业务优先级排序或资源分配决策时使用。",
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
      summary: "Eval cases for bcg-matrix.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
