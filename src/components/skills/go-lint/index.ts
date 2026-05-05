import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goLintSkill = defineSkill({
  id: "go-lint",
  fullName: "go-lint",
  description: "当 Go 项目需要配置或使用 golangci-lint、理解 linter 规则、抑制误报、或在 CI 中集成 lint 时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "linter-reference",
      source: new URL("./references/linter-reference.md", import.meta.url),
      target: "references/linter-reference.md",
      title: "linter-reference.md",
      summary: "Reference material for go-lint.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-lint.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
