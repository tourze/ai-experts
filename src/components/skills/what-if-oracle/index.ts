import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const whatIfOracleSkill = defineSkill({
  id: "what-if-oracle",
  fullName: "What-If 推演器",
  description: "当需要对不确定决策做未来分支推演、情景分析或最好/最坏情况评估时使用。用户提到\"如果会怎样\"\"有哪些可能性\"\"最好最坏情景\"时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "bayesian-decision",
      source: new URL("./references/bayesian-decision.md", import.meta.url),
      target: "references/bayesian-decision.md",
      title: "bayesian-decision.md",
      summary: "Reference material for what-if-oracle.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scenario-templates",
      source: new URL("./references/scenario-templates.md", import.meta.url),
      target: "references/scenario-templates.md",
      title: "scenario-templates.md",
      summary: "Reference material for what-if-oracle.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for what-if-oracle.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
