import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
