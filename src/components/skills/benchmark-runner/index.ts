import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const benchmarkRunnerSkill = defineSkill({
  id: "benchmark-runner",
  fullName: "基准测试设计",
  description: "当用户需要比较两个或多个实现的性能、做基准测试或评估延迟/吞吐/内存差异时使用。",
  useCases: [
    "用户要比较两个或多个候选方案的性能，而不是做泛泛的架构选型。",
    "需要衡量延迟、吞吐、内存、准确率、成本、冷启动等指标。",
    "需要产出可复现实验方案，或对已有结果做结构化解读。",
    "需要结合 [testing-strategy](../testing-strategy/SKILL.md) 制定性能验证计划。",
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
      summary: "Reference material for benchmark-runner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "metric-selection",
      source: new URL("./references/metric-selection.md", import.meta.url),
      target: "references/metric-selection.md",
      title: "metric-selection.md",
      summary: "Reference material for benchmark-runner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "statistical-rigor",
      source: new URL("./references/statistical-rigor.md", import.meta.url),
      target: "references/statistical-rigor.md",
      title: "statistical-rigor.md",
      summary: "Reference material for benchmark-runner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "test-case-design",
      source: new URL("./references/test-case-design.md", import.meta.url),
      target: "references/test-case-design.md",
      title: "test-case-design.md",
      summary: "Reference material for benchmark-runner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
