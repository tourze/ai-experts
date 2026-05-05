import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goErrorHandlingSkill = defineSkill({
  id: "go-error-handling",
  description: "当 Go 代码需要设计、包装、比较、传播或审查 error 语义时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "error-creation",
      source: new URL("./references/error-creation.md", import.meta.url),
      target: "references/error-creation.md",
      title: "error-creation.md",
      summary: "Reference material for go-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "error-wrapping",
      source: new URL("./references/error-wrapping.md", import.meta.url),
      target: "references/error-wrapping.md",
      title: "error-wrapping.md",
      summary: "Reference material for go-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-error-handling.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
