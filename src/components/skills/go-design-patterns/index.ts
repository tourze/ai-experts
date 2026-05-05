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
      summary: "Reference material for go-design-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
