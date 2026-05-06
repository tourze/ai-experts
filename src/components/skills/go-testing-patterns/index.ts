import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  checklist: [
    "每个测试 case 是否有明确 `name`，失败时能定位场景？",
    "测试是否依赖执行顺序、真实时间、真实网络或全局状态？",
    "可并行测试是否安全使用 `t.Parallel()`？",
    "集成测试是否用 build tag 与单元测试隔离？",
    "并发代码是否跑过 `go test -race ./...`，必要时是否有 leak 检测？",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "测实现细节",
      pass: "测可观察行为",
    }),
    defineAntiPattern({
      fail: "用 Sleep 等异步完成",
      pass: "用同步信号",
    }),
    defineAntiPattern({
      fail: "测内部字段/方法。",
      pass: "测公共 API 的可观察行为。",
    }),
    defineAntiPattern({
      fail: "`time.Sleep` 等异步完成。",
      pass: "用 channel/WaitGroup 同步。",
    }),
    defineAntiPattern({
      fail: "测试间有执行顺序依赖。",
      pass: "每个测试独立可运行。",
    }),
    defineAntiPattern({
      fail: "忘记 `t.Parallel()`。",
      pass: "独立纯函数测试应并行。",
    }),
    defineAntiPattern({
      fail: "集成测试混入单元测试。",
      pass: "用 `//go:build integration` 隔离。",
    }),
    defineAntiPattern({
      fail: "并发测试不跑 `-race`。",
      pass: "用 `go test -race ./...`。",
    }),
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
      summary: "Go HTTP handler 测试模式：httptest、请求构建、响应断言与中间件隔离。",
      loadWhen: "需要编写或审查 Go HTTP handler 的单元测试时读取。",
    }),
    defineReference({
      id: "mocking",
      source: new URL("./references/mocking.md", import.meta.url),
      target: "references/mocking.md",
      title: "mocking.md",
      summary: "Go mock 策略：接口 mock、monkey patch 的取舍与 mock 对象管理。",
      loadWhen: "需要为测试隔离外部依赖或设计 mock 接口时读取。",
    }),
    defineReference({
      id: "testify",
      source: new URL("./references/testify.md", import.meta.url),
      target: "references/testify.md",
      title: "testify.md",
      summary: "Testify 库使用指南：assert、require、suite 与 mock 包的完整示例。",
      loadWhen: "需要集成或使用 testify 库编写测试时读取。",
    }),
  ],
});
