import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";

export const benchmarkRunnerSkill = defineSkill({
  id: "benchmark-runner",
  fullName: "基准测试设计",
  description:
    "当用户需要比较两个或多个实现的性能、做基准测试或评估延迟/吞吐/内存差异时使用。",
  useCases: [
    "用户要比较两个或多个候选方案的性能，而不是做泛泛的架构选型。",
    "需要衡量延迟、吞吐、内存、准确率、成本、冷启动等指标。",
    "需要产出可复现实验方案，或对已有结果做结构化解读。",
    "需要把性能实验纳入更大的测试策略或验收计划。",
  ],
  constraints: [
    "候选方案必须可比：相同输入、相同环境、相同配置边界。",
    "每次只选 `2-4` 个核心指标；指标过多会让结论失真。",
    "必须记录环境：硬件、系统、运行时、依赖版本、关键配置。",
    "必须报告波动，不只报平均值；至少给出样本数和离散情况。",
    "无法实际运行时，只输出实验设计，不伪造结果。",
    "需要指标、用例、环境或统计细节时按 Reference Map 读取对应 reference。",
  ],
  checklist: [
    "候选版本和配置写清楚了",
    "输入规模覆盖小/中/大或等价分层",
    "预热与正式迭代分开",
    "环境信息完整记录",
    "输出包含波动或样本信息",
    "结论按指标拆开，而不是一句“B 更快”",
    "已注明实验局限和不可外推条件",
  ],
  relatedSkills: [
    {
      get id() {
        return testingStrategySkill.id;
      },
      reason: "需要把基准测试纳入端到端验证、发布门禁或测试矩阵时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不同环境比",
      pass: "同环境",
    }),
    defineAntiPattern({
      fail: "只报均值",
      pass: "p50/p95/p99 + 样本数",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先定义 benchmark scope：候选版本、配置边界、决策问题和 2-4 个核心指标。",
      "设计测试矩阵：小/中/大输入规模、生产常见载荷、边界压力、预热次数和正式迭代次数。",
      "固定环境：硬件、系统、运行时、依赖版本、关键配置、端口、并发度和数据集。",
      "给出可复现执行命令；能运行时采集结果，不能运行时只输出实验设计。",
      "报告 p50/p95/p99、吞吐、峰值 RSS、样本数、波动和异常值，不只报平均值。",
      "按指标拆结论和取舍，并写明实验局限、不可外推条件和下一轮验证。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Benchmark Scope：候选 A/B、决策问题、核心指标和环境边界。",
      "测试矩阵、预热/迭代计划、执行命令、环境快照和原始结果位置。",
      "结果摘要、波动/样本信息、取舍分析、结论、局限和测试策略联动项。",
    ],
  }),
  references: [
    defineReference({
      id: "environment-capture",
      source: new URL("./references/environment-capture.md", import.meta.url),
      target: "references/environment-capture.md",
      title: "environment-capture.md",
      summary: "环境信息采集脚本与系统配置快照规范。",
      loadWhen:
        "需要记录基准测试环境或复现测试条件时读取。",
    }),
    defineReference({
      id: "metric-selection",
      source: new URL("./references/metric-selection.md", import.meta.url),
      target: "references/metric-selection.md",
      title: "metric-selection.md",
      summary: "性能指标选取指南：延迟、吞吐、资源利用率的权衡。",
      loadWhen:
        "需要确定测量哪些性能指标或对比不同指标的适用场景时读取。",
    }),
    defineReference({
      id: "statistical-rigor",
      source: new URL("./references/statistical-rigor.md", import.meta.url),
      target: "references/statistical-rigor.md",
      title: "statistical-rigor.md",
      summary: "统计严谨性要求：样本量计算、方差分析与显著性检验。",
      loadWhen:
        "需要确保基准测试结果具有统计意义时读取。",
    }),
    defineReference({
      id: "test-case-design",
      source: new URL("./references/test-case-design.md", import.meta.url),
      target: "references/test-case-design.md",
      title: "test-case-design.md",
      summary: "测试用例设计方法：覆盖正常路径、边界值与压力场景。",
      loadWhen:
        "需要设计基准测试用例或覆盖边界场景时读取。",
    }),
  ],
});
