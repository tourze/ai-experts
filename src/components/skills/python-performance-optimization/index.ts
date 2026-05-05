import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pythonPerformanceOptimizationSkill = defineSkill({
  id: "python-performance-optimization",
  fullName: "Python 性能优化",
  description: "当用户要分析 Python 性能瓶颈、做 profiling、降低延迟、减少内存占用或建立可复现实验时使用。",
  useCases: [
    "请求慢、任务慢、CPU 高、内存涨，需要先找瓶颈再优化。",
    "需要比较不同算法、数据结构或缓存策略的收益。",
    "需要给数据库、I/O、批处理、异步并发做针对性优化。",
    "更复杂的 NumPy、并行和缓存策略见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "异步 I/O 优化时，联动 [async-python-patterns](../async-python-patterns/SKILL.md)。",
    "结构层面的复杂度治理时，联动 [python-design-patterns](../python-design-patterns/SKILL.md)。",
  ],
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
  ],
});
