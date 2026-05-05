import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitAnalyzeSkill = defineSkill({
  id: "speckit-analyze",
  fullName: "Speckit Analyze",
  description: "当用户要在任务拆解后审计规格、计划、任务三件套的一致性、重复、冲突或遗漏风险时使用。",
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
      summary: "Eval cases for speckit-analyze.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
