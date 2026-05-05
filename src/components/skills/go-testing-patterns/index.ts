import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goTestingPatternsSkill = defineSkill({
  id: "go-testing-patterns",
  fullName: "go-testing-patterns",
  description: "当 Go 代码需要测试设计、table-driven tests、mock、race、fuzz 或 flaky test 排查时使用。",
  useCases: [
    "为 Go 函数、HTTP handler、repository、worker、并发代码或 CLI 编写测试。",
    "审查测试是否只测实现细节、是否缺错误分支、是否存在顺序依赖或真实时间等待。",
    "排查 flaky test、goroutine 泄漏、race detector 失败或集成测试污染。",
    "性能测试和 `benchstat` 对比配合 [go-performance](../go-performance/SKILL.md)；并发生命周期配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)。",
  ],
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
  ],
});
