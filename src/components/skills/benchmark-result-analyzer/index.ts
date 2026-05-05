import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const benchmarkResultAnalyzerSkill = defineSkill({
  id: "benchmark-result-analyzer",
  description: "当用户要分析 benchmark、A/B 评测、with-skill vs baseline 结果，解释胜负原因并生成可执行改进建议时使用。",
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
      summary: "Eval cases for benchmark-result-analyzer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
