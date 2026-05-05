import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goPerformanceSkill } from "../go-performance/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const goTestingPatternsSkill = defineSkill({
  id: "go-testing-patterns",
  fullName: "go-testing-patterns",
  description: "当 Go 代码需要测试设计、table-driven tests、mock、race、fuzz 或 flaky test 排查时使用。",
  useCases: [
    "为 Go 函数、HTTP handler、repository、worker、并发代码或 CLI 编写测试。",
    "审查测试是否只测实现细节、是否缺错误分支、是否存在顺序依赖或真实时间等待。",
    "排查 flaky test、goroutine 泄漏、race detector 失败或集成测试污染。",
    "性能测试和 `benchstat` 对比配合 `go-performance`；并发生命周期配合 `go-concurrency-patterns`。",
  ],
  constraints: [
    "公共 API 优先用外部包名 `package xxx_test`。",
    "table-driven tests 必须有 `name` 字段并通过 `t.Run(tt.name, ...)` 暴露失败场景。",
    "可独立并行的纯函数测试使用 `t.Parallel()`；共享资源、环境变量、全局状态测试不要盲目并行。",
    "集成测试用 `//go:build integration` 隔离，普通 `go test ./...` 不应依赖外部服务。",
    "时间相关测试优先注入 clock 或使用可控时间，不用 `time.Sleep` 猜测异步完成。",
    "并发代码测试要考虑 `go test -race ./...` 和 goroutine leak 检测。",
  ],
  relatedSkills: [
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "性能测试和 `benchstat` 对比配合 `go-performance`；并发生命周期配合 `go-concurrency-patterns`。",
    },
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "性能测试和 `benchstat` 对比配合 `go-performance`；并发生命周期配合 `go-concurrency-patterns`。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 Go 特有语法与工具。",
    },
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
