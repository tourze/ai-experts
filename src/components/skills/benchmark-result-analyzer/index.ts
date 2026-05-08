import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineAntiPattern,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const benchmarkResultAnalyzerSkill = defineSkill({
  id: "benchmark-result-analyzer",
  fullName: "Benchmark Result Analyzer",
  description:
    "当用户要分析 benchmark、A/B 评测、with-skill vs baseline 结果，解释胜负原因并生成可执行改进建议时使用。",
  useCases: [
    "已有 blind comparison、grading、benchmark.json 或多轮运行结果，需要解释模式。",
    "需要揭盲后比较胜者 skill 与败者 skill 的结构、资源、脚本和执行路径。",
    "需要分析多次运行中稳定失败、稳定通过或异常波动的 expectation。",
    "需要把评测结论转成 skill 指令、工具、示例、错误处理或结构改进建议。",
  ],
  constraints: [
    "不重新替代 comparator 判胜；先理解既有评分和理由，再分析因果。",
    "必须读取胜者/败者 skill、transcript、输出和比较结果，不能只看汇总分。",
    "改进建议必须绑定可观察失败原因，不能写“优化说明”“补充示例”这类泛化建议。",
    "区分 skill 问题、executor 执行问题、eval assertion 问题和任务本身不合理。",
    "建议按 impact 排序，优先列最可能改变下一轮胜负的改动。",
  ],
  checklist: [
    "已读取 comparison / grading / benchmark 汇总，并记录原始胜负判断。",
    "已读取胜者和败者 skill 的 `SKILL.md` 与关键资源文件。",
    "已读取双方 transcript，比较工具使用、失败恢复和指令遵循差异。",
    "已区分稳定模式和单次偶发异常。",
    "每条建议都写清 category、priority、suggestion 和 expected_impact。",
    "明确哪些问题属于 eval 本身，需要修 assertion 而不是修 skill。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "分数复述：这没有解释可迁移模式，也不能指导下一轮改动。",
      pass: "因果链",
    }),
    defineAntiPattern({
      fail: "把 eval 问题误判成 skill 问题：也可能是任务缺输入、assertion 无法验证或 benchmark harness 有问题。",
      pass: "分清责任层",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先读取 comparison、grading 或 benchmark 汇总，记录原始胜负判断，不重新替代 comparator 判胜。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "并排读取胜者/败者 skill、关键资源、transcript 和输出，比较指令遵循、工具使用和失败恢复。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "区分 skill 指令问题、executor 执行问题、eval assertion 问题和任务本身不合理。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "从多轮结果中识别稳定失败、稳定通过、异常波动和只在特定 expectation 上暴露的问题。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "按 impact 排序建议；每条建议必须绑定可观察失败原因、category、priority、expected_impact 和下一轮验证方式。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "comparison_summary：winner、原始判胜理由、关键证据和是否保留 comparator 结论。",
      "winner_strengths、loser_weaknesses、instruction_following 差异和责任层分类。",
      "improvement_suggestions：priority、category、suggestion、expected_impact 和下一轮验证方式。",
    ],
  }),
});
