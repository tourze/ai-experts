import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpErrorHandlingSkill = defineSkill({
  id: "php-error-handling",
  fullName: "PHP 错误处理",
  description: "当用户要设计 PHP 异常层级、实现输入校验边界、做错误映射、处理批量部分失败或规范 try/catch 纪律时使用。",
  useCases: [
    "API、CLI、队列 worker 需要稳定处理坏输入和外部依赖失败。",
    "需要建立统一异常层级和用户可见错误映射。",
    "批处理场景要区分\"全部失败\"和\"部分失败\"。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
