import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pythonPerformanceOptimizationSkill = defineSkill({
  id: "python-performance-optimization",
  description: "当用户要分析 Python 性能瓶颈、做 profiling、降低延迟、减少内存占用或建立可复现实验时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for python-performance-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for python-performance-optimization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
