import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const scpAnalysisSkill = defineSkill({
  id: "scp-analysis",
  description: "当用户要分析外部冲击对行业和企业的传导影响或连锁效应时使用。常规竞争分析或内部经营诊断不适用。",
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
      summary: "Eval cases for scp-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
