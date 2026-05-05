import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustProcMacroPatternsSkill = defineSkill({
  id: "rust-proc-macro-patterns",
  fullName: "Rust Proc Macro Patterns",
  description: "当用户需要开发 Rust 过程宏时使用；涉及 derive macro、attribute macro、syn/quote 或 proc-macro2 时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-proc-macro-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-proc-macro-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
