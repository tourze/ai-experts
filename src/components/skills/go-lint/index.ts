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
  useCases: [
    "在 Go 项目中引入或调整 `golangci-lint` 配置（`.golangci.yml`）。",
    "排查 lint 报错、选择启用/禁用哪些 linter、理解某条规则的意义。",
    "需要用 `//nolint` 抑制告警，或评估是否应该全局禁用某个 linter。",
    "在 CI/CD 流水线中集成 `golangci-lint` 作为 PR 门禁。",
    "代码审查中讨论 lint 相关的代码质量问题。",
  ],
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
  ],
});
