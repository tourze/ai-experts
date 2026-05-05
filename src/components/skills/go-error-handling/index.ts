import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
