import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const benchmarkResultAnalyzerSkill = defineSkill({
  id: "benchmark-result-analyzer",
  fullName: "Benchmark Result Analyzer",
  description: "当用户要分析 benchmark、A/B 评测、with-skill vs baseline 结果，解释胜负原因并生成可执行改进建议时使用。",
  useCases: [
    "已有 blind comparison、grading、benchmark.json 或多轮运行结果，需要解释模式。",
    "需要揭盲后比较胜者 skill 与败者 skill 的结构、资源、脚本和执行路径。",
    "需要分析多次运行中稳定失败、稳定通过或异常波动的 expectation。",
    "需要把评测结论转成 skill 指令、工具、示例、错误处理或结构改进建议。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
