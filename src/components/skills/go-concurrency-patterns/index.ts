import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goConcurrencyPatternsSkill = defineSkill({
  id: "go-concurrency-patterns",
  description: "当 Go 代码涉及并发、goroutine 生命周期控制或竞态排查时使用。",
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
      summary: "Reference material for go-concurrency-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "channels-and-select",
      source: new URL("./references/channels-and-select.md", import.meta.url),
      target: "references/channels-and-select.md",
      title: "channels-and-select.md",
      summary: "Reference material for go-concurrency-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "go-context-lifecycle",
      source: new URL("./references/go-context-lifecycle.md", import.meta.url),
      target: "references/go-context-lifecycle.md",
      title: "go-context-lifecycle.md",
      summary: "Reference material for go-concurrency-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sync-primitives",
      source: new URL("./references/sync-primitives.md", import.meta.url),
      target: "references/sync-primitives.md",
      title: "sync-primitives.md",
      summary: "Reference material for go-concurrency-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-concurrency-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
