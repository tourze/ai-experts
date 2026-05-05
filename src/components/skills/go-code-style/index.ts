import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goCodeStyleSkill = defineSkill({
  id: "go-code-style",
  fullName: "go-code-style",
  description: "当 Go 代码需要风格、可读性、文件组织、函数签名或惯用写法判断时使用。",
  useCases: [
    "编写或审查 Go 代码时，需要判断“能跑”和“好维护”之间的差距。",
    "需要处理长函数、深层嵌套、过长参数列表、导出面过大、命名字段缺失等可读性问题。",
    "需要把 AI 生成的 Go 代码改成更接近工程惯例的版本。",
    "需要命名或错误语义时配合 [go-error-handling](../go-error-handling/SKILL.md)；涉及 nil、slice、map 或资源安全时配合 [go-safety](../go-error-handling/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "documentation",
      source: new URL("./references/documentation.md", import.meta.url),
      target: "references/documentation.md",
      title: "documentation.md",
      summary: "Reference material for go-code-style.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
