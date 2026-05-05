import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goErrorHandlingSkill } from "../go-error-handling/index";

export const goCodeStyleSkill = defineSkill({
  id: "go-code-style",
  fullName: "go-code-style",
  description: "当 Go 代码需要风格、可读性、文件组织、函数签名或惯用写法判断时使用。",
  useCases: [
    "编写或审查 Go 代码时，需要判断“能跑”和“好维护”之间的差距。",
    "需要处理长函数、深层嵌套、过长参数列表、导出面过大、命名字段缺失等可读性问题。",
    "需要把 AI 生成的 Go 代码改成更接近工程惯例的版本。",
    "需要命名或错误语义时配合 `go-error-handling`；涉及 nil、slice、map 或资源安全时配合 `go-safety`。",
  ],
  constraints: [
    "先跑 `gofmt` / `go test` / 项目既有 lint，再讨论主观风格；格式问题交给工具。",
    "错误和边界条件先返回，主路径保持浅缩进；不要用多层 `else` 包住正常逻辑。",
    "`context.Context` 放第一个参数；函数参数超过 4 个时优先收敛成配置结构体或领域对象。",
    "struct literal 默认使用命名字段，避免上游结构体字段调整导致静默错位。",
    "slice/map 返回空集合时使用 `[]T{}` / `map[K]V{}` 或 `make`，不要把成功路径表达成 `nil`。",
    "最小化公开 API：没有跨包使用证据的类型、函数、字段默认不导出。",
  ],
  relatedSkills: [
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      label: "go-safety",
      reason: "需要命名或错误语义时配合 `go-error-handling`；涉及 nil、slice、map 或资源安全时配合 `go-safety`。",
    },
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      reason: "需要命名或错误语义时配合 `go-error-handling`；涉及 nil、slice、map 或资源安全时配合 `go-safety`。",
    },
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
