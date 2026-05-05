import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { asyncPythonPatternsSkill } from "../async-python-patterns/index";
import { pythonDesignPatternsSkill } from "../python-design-patterns/index";

export const pythonPerformanceOptimizationSkill = defineSkill({
  id: "python-performance-optimization",
  fullName: "Python 性能优化",
  description: "当用户要分析 Python 性能瓶颈、做 profiling、降低延迟、减少内存占用或建立可复现实验时使用。",
  useCases: [
    "请求慢、任务慢、CPU 高、内存涨，需要先找瓶颈再优化。",
    "需要比较不同算法、数据结构或缓存策略的收益。",
    "需要给数据库、I/O、批处理、异步并发做针对性优化。",
    "更复杂的 NumPy、并行和缓存策略见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "异步 I/O 优化时，联动 `async-python-patterns`。",
    "结构层面的复杂度治理时，联动 `python-design-patterns`。",
  ],
  constraints: [
    "没有测量就不要优化；先 profile，再改代码。",
    "一次只改一个变量，并用同一组输入做前后对比。",
    "先做算法和数据结构级优化，再考虑微调语法糖。",
    "benchmark 要写明输入规模、运行轮次和环境，不要凭感觉说“更快”。",
    "不为了局部速度把代码可读性和可维护性直接打穿。",
  ],
  checklist: [
    "已用 profiler 或 benchmark 证明热点在哪里。",
    "已确认瓶颈是 CPU、内存、数据库、网络还是锁竞争。",
    "优化前后使用相同输入规模和相同运行环境对比。",
    "优化带来的复杂度是否值得维护成本。",
    "已保留回归基线，避免以后“优化”把性能改坏却无从发现。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonDesignPatternsSkill.id;
      },
      reason: "结构层面的复杂度治理时，联动 `python-design-patterns`。",
    },
    {
      get id() {
        return asyncPythonPatternsSkill.id;
      },
      reason: "异步 I/O 优化时，联动 `async-python-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "没有 profile 就优化：实际瓶颈是 `process()` 里的 HTTP 调用（I/O），换 numpy 不解决问题。",
      pass: "先测量再优化",
    }),
    defineAntiPattern({
      fail: "单次运行下结论：一次运行受 GC、缓存预热、系统负载影响，不可作为基准。",
      pass: "可复现的 benchmark",
    }),
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
      summary: "Python 性能优化高级模式，包括 NumPy、并行计算和复杂缓存策略。",
      loadWhen: "需要查阅 NumPy 加速、并行计算或复杂缓存策略时读取。",
    }),
  ],
});
