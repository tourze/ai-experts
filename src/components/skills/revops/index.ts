import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const revopsSkill = defineSkill({
  id: "revops",
  description: "当用户要设计收入运营体系、线索生命周期、MQL/SQL、lead scoring、CRM 自动化、线索路由或营销销售交接时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "scoring-and-pipeline",
      source: new URL("./references/scoring-and-pipeline.md", import.meta.url),
      target: "references/scoring-and-pipeline.md",
      title: "scoring-and-pipeline.md",
      summary: "Reference material for revops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for revops.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
