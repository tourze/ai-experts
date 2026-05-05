import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const goPerformanceSkill = defineSkill({
  id: "go-performance",
  description: "当 Go 代码需要性能优化、benchmark、pprof、benchstat 或优化验证时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "benchmarking",
      source: new URL("./references/benchmarking.md", import.meta.url),
      target: "references/benchmarking.md",
      title: "benchmarking.md",
      summary: "Reference material for go-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pprof",
      source: new URL("./references/pprof.md", import.meta.url),
      target: "references/pprof.md",
      title: "pprof.md",
      summary: "Reference material for go-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-performance.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
