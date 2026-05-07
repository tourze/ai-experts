import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const goErrorHandlingSkill = defineSkill({
  id: "go-error-handling",
  fullName: "Go 错误处理",
  description: "当 Go 代码需要设计、包装、比较、传播或审查 error 语义时使用。",
  useCases: [
    "编写或审查返回 `error` 的 Go 函数、库 API、CLI 命令、HTTP handler 或后台任务。",
    "需要决定 sentinel error、自定义错误类型、`errors.Is` / `errors.As`、`errors.Join` 或 panic 边界。",
  ],
  constraints: [
    "不丢弃错误；如果确实无法处理，必须说明原因并让调用方看到失败。",
    "跨函数边界保留根因：用 `fmt.Errorf(\"operation: %w\", err)` 包装，不用 `%v` 吞掉错误链。",
    "错误文本面向人，错误类型/变量面向程序；调用方需要分支时提供 sentinel error 或自定义类型。",
    "不用 panic 表达普通业务失败；panic 只用于不可恢复的编程错误或初始化失败。",
    "错误字符串小写、无句号，并带操作上下文；不要把动态上下文塞进 sentinel error。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 %v 格式化吞掉错误链。",
      pass: "用 %w 保留根因。",
    }),
    defineAntiPattern({
      fail: "用 err.Error() 字符串分支。",
      pass: "用 errors.Is / errors.As。",
    }),
    defineAntiPattern({
      fail: "sentinel error 含动态值。",
      pass: "sentinel 只表达稳定类别。",
    }),
    defineAntiPattern({
      fail: "普通业务失败用 panic。",
      pass: "panic 只用于不可恢复的编程错误。",
    }),
    defineAntiPattern({
      fail: "错误字符串大写或有句号。",
      pass: "小写、无句号、带操作上下文。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计 Go 错误合同、错误链、sentinel error、自定义错误类型和上下文包装方式。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认错误是否跨包暴露、调用方是否需要 `errors.Is` / `errors.As`、是否需要稳定合同。",
      "保留错误链用 `%w`，sentinel error 表达稳定可匹配状态，自定义类型携带结构化字段。",
      "错误信息保留操作和关键上下文，但不要重复上层已经会补的内容。",
      "快速代码模式读取 `error-patterns`；创建和包装细节读取 `error-creation` / `error-wrapping`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "错误类型、sentinel、自定义字段和 `%w` 包装策略。",
      "调用方匹配方式、HTTP / gRPC 等边界转换和测试建议。",
      "需要修复的丢链、字符串匹配或上下文重复问题。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "error-patterns",
      source: new URL("./references/error-patterns.md", import.meta.url),
      target: "references/error-patterns.md",
      title: "Go 错误处理代码模式",
      summary: "错误链、sentinel error 和自定义错误类型的 Go 示例。",
      loadWhen: "需要快速套用 Go 错误合同或错误包装模式时读取。",
    }),
    defineReference({
      id: "error-creation",
      source: new URL("./references/error-creation.md", import.meta.url),
      target: "references/error-creation.md",
      title: "error-creation.md",
      summary: "Go 错误创建方式：sentinel error、自定义错误类型与 fmt.Errorf 约定。",
      loadWhen: "需要设计错误类型、sentinel error 或评估 panic 边界时读取。",
    }),
    defineReference({
      id: "error-wrapping",
      source: new URL("./references/error-wrapping.md", import.meta.url),
      target: "references/error-wrapping.md",
      title: "error-wrapping.md",
      summary: "Go 错误包装与解包：%w、errors.Is、errors.As 与错误链检查。",
      loadWhen: "需要跨函数边界传播错误或解析多层包装的错误链时读取。",
    }),
  ],
});
