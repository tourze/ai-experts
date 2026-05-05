import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustAsyncPatternsSkill = defineSkill({
  id: "rust-async-patterns",
  fullName: "Rust Async Patterns",
  description: "当用户需要开发或排障 Tokio 异步代码时使用；涉及 tokio::spawn、JoinSet、channel、select! 或异步生命周期时触发。",
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
      summary: "Reference material for rust-async-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-async-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
