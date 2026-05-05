import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const benchmarkRunnerSkill = defineSkill({
  id: "benchmark-runner",
  description: "当用户需要比较两个或多个实现的性能、做基准测试或评估延迟/吞吐/内存差异时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for benchmark-runner.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
