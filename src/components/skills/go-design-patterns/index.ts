import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const goDesignPatternsSkill = defineSkill({
  id: "go-design-patterns",
  fullName: "Go 设计模式",
  description: "当 Go 代码涉及架构模式、函数式选项、构造器设计、init() 避免、韧性模式、资源管理、DI 或 Clean Architecture 时使用。",
  useCases: [
    "用函数式选项（Functional Options）设计可配置的构造器。",
    "编写 `New()` 构造函数，需要参数校验、依赖注入或默认值填充。",
    "审查或移除 `init()` 带来的隐式副作用与测试顺序依赖。",
    "为外部调用添加超时、重试、熔断等韧性模式。",
    "设计优雅停机流程：信号监听 → 停止接收 → 排空进行中请求。",
  ],
  constraints: [
    "**函数式选项优于配置结构体**：公开 API 用 `WithXxx()` 选项函数。",
    "**构造器返回具体类型指针**：`func NewT(opts ...Option) (*T, error)`，校验失败返回 error。",
    "**禁止 `init()` 做业务逻辑**：只用于纯被动注册（如 driver 注册）。",
    "**每个外部调用必须有超时**：不允许无 context 的网络 I/O。",
    "**重试必须检查 context 取消**：循环内先 `select { case <-ctx.Done(): return ctx.Err() ... }`。",
    "**优雅停机三步**：监听信号 → 停止接受新连接 → 在超时内排空进行中请求。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "构造器返回接口值。",
      pass: "返回 *T，让调用方按需转接口。",
    }),
    defineAntiPattern({
      fail: "在 init() 里建连接或读文件。",
      pass: "移入 New() 显式调用。",
    }),
    defineAntiPattern({
      fail: "外部调用无超时。",
      pass: "所有 I/O 传 context.WithTimeout。",
    }),
    defineAntiPattern({
      fail: "重试循环忽略 context 取消。",
      pass: "每次循环先检查 ctx.Err()。",
    }),
    defineAntiPattern({
      fail: "停机直接 os.Exit。",
      pass: "先 Shutdown 排空进行中请求，再退出。",
    }),
    defineAntiPattern({
      fail: "使用 Service Locator 全局注册表。",
      pass: "构造器注入依赖。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认问题是构造参数膨胀、可选配置、重试容错、生命周期管理还是依赖替换。",
      "函数式选项用于稳定构造 API；重试必须检查 context；优雅停机必须有超时。",
      "不要为模式而模式，优先使用简单函数、接口和组合。",
      "常用代码模式读取 `implementation-patterns`；依赖注入细节读取 `di`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "适用的 Go 设计模式、使用原因和不使用更重抽象的理由。",
      "构造、重试、停机或依赖注入的代码结构建议。",
      "测试点、生命周期风险和剩余 trade-off。",
    ],
  }),
  references: [
    defineReference({
      id: "implementation-patterns",
      source: new URL("./references/implementation-patterns.md", import.meta.url),
      target: "references/implementation-patterns.md",
      title: "Go 设计模式代码示例",
      summary: "函数式选项、context-aware retry 和优雅停机的 Go 代码模式。",
      loadWhen: "需要快速实现 Go 构造配置、重试或 graceful shutdown 时读取。",
    }),
    defineReference({
      id: "di",
      source: new URL("./references/di.md", import.meta.url),
      target: "references/di.md",
      title: "di.md",
      summary: "Go 依赖注入模式：构造函数注入、wire 工具与手动 DI 容器的最佳实践。",
      loadWhen: "需要设计或重构 Go 项目的依赖注入方式时读取。",
    }),
  ],
});
