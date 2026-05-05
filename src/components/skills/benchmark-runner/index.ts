import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
    "需要结合 `testing-strategy` 制定性能验证计划。",
  ],
  constraints: [
    "候选方案必须可比：相同输入、相同环境、相同配置边界。",
    "每次只选 `2-4` 个核心指标；指标过多会让结论失真。",
    "必须记录环境：硬件、系统、运行时、依赖版本、关键配置。",
    "必须报告波动，不只报平均值；至少给出样本数和离散情况。",
    "无法实际运行时，只输出实验设计，不伪造结果。",
    "优先加载这些参考文件：\n- [metric-selection.md](./references/metric-selection.md)\n- [test-case-design.md](./references/test-case-design.md)\n- [environment-capture.md](./references/environment-capture.md)\n- [statistical-rigor.md](./references/statistical-rigor.md)",
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
      reason: "需要结合 `testing-strategy` 制定性能验证计划。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
