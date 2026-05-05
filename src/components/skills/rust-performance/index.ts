import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustPerformanceSkill = defineSkill({
  id: "rust-performance",
  description: "当用户要分析 Rust 性能瓶颈、做 flamegraph/benchmark、优化分配策略或判断\"该不该优化\"时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-03",
      source: new URL("./references/chapter_03.md", import.meta.url),
      target: "references/chapter_03.md",
      title: "chapter_03.md",
      summary: "Reference material for rust-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-performance.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
