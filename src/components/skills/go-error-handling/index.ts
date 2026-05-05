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
      summary: "Reference material for go-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "error-wrapping",
      source: new URL("./references/error-wrapping.md", import.meta.url),
      target: "references/error-wrapping.md",
      title: "error-wrapping.md",
      summary: "Reference material for go-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
