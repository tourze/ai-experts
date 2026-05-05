import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const pdcaCycleSkill = defineSkill({
  id: "pdca-cycle",
  description: "当用户要用 PDCA 做持续改进、质量管理、运营优化或闭环问题解决时使用。",
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
      summary: "Eval cases for pdca-cycle.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
