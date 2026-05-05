import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goTestingPatternsSkill = defineSkill({
  id: "go-testing-patterns",
  description: "当 Go 代码需要测试设计、table-driven tests、mock、race、fuzz 或 flaky test 排查时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "http-testing",
      source: new URL("./references/http-testing.md", import.meta.url),
      target: "references/http-testing.md",
      title: "http-testing.md",
      summary: "Reference material for go-testing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mocking",
      source: new URL("./references/mocking.md", import.meta.url),
      target: "references/mocking.md",
      title: "mocking.md",
      summary: "Reference material for go-testing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testify",
      source: new URL("./references/testify.md", import.meta.url),
      target: "references/testify.md",
      title: "testify.md",
      summary: "Reference material for go-testing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-testing-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
