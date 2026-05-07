import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { goDataStructuresSkill } from "../go-data-structures/index";
import { goErrorHandlingSkill } from "../go-error-handling/index";

export const goCodeStyleSkill = defineSkill({
  id: "go-code-style",
  fullName: "go-code-style",
  description: "当 Go 代码需要风格、可读性、文件组织、函数签名或惯用写法判断时使用。",
  useCases: [
    "编写或审查 Go 代码时，需要判断“能跑”和“好维护”之间的差距。",
    "需要处理长函数、深层嵌套、过长参数列表、导出面过大、命名字段缺失等可读性问题。",
    "需要把 AI 生成的 Go 代码改成更接近工程惯例的版本。",
    "需要命名或错误语义时配合 `go-error-handling`；涉及 nil、slice、map 或 copy 语义时配合 `go-data-structures`。",
  ],
  constraints: [
    "先跑 `gofmt` / `go test` / 项目既有 lint，再讨论主观风格；格式问题交给工具。",
    "错误和边界条件先返回，主路径保持浅缩进；不要用多层 `else` 包住正常逻辑。",
    "`context.Context` 放第一个参数；函数参数超过 4 个时优先收敛成配置结构体或领域对象。",
    "struct literal 默认使用命名字段，避免上游结构体字段调整导致静默错位。",
    "slice/map 返回空集合时使用 `[]T{}` / `map[K]V{}` 或 `make`，不要把成功路径表达成 `nil`。",
    "最小化公开 API：没有跨包使用证据的类型、函数、字段默认不导出。",
  ],
  checklist: [
    "是否存在可以用早返回压平的 `else` / 深层嵌套？",
    "是否有 5 个以上参数、重复参数组或应成为领域对象的配置集合？",
    "struct literal 是否使用命名字段？",
    "成功返回的 slice/map 是否会给调用方暴露 `nil` 语义？",
    "是否有仅因“未来可能复用”而导出的类型或函数？",
    "是否跑了 `gofmt`、`go test ./...` 或项目既有验证命令？",
  ],
  relatedSkills: [
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      reason: "需要命名或错误语义时联动。",
    },
    {
      get id() {
        return goDataStructuresSkill.id;
      },
      reason: "涉及 nil、slice、map 或 copy 语义时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "按提示保留深层嵌套",
      pass: "边界先返回",
    }),
    defineAntiPattern({
      fail: "为了”可复用”导出内部细节",
      pass: "先保持内部可变",
    }),
    defineAntiPattern({
      fail: "深层嵌套 `if-else`。",
      pass: "错误/边界先返回，主路径保持浅缩进。",
    }),
    defineAntiPattern({
      fail: "5+ 个函数参数。",
      pass: "收敛成配置结构体或领域对象。",
    }),
    defineAntiPattern({
      fail: "struct literal 不命名字段。",
      pass: "命名字段防止字段重排导致静默错位。",
    }),
    defineAntiPattern({
      fail: "成功返回 `nil` slice/map。",
      pass: "返回 `[]T{}` / `map[K]V{}`。",
    }),
    defineAntiPattern({
      fail: "导出”将来可能复用”的类型。",
      pass: "先不导出，有跨包需求时再导出。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先识别函数职责、错误路径、参数列表、条件复杂度和注释噪声。",
      "用早返回保持主路径清晰，用领域对象收口参数膨胀，用命名布尔表达式拆复杂条件。",
      "注释优先解释原因和不变量，不翻译代码；公共 API 文档另按文档规范处理。",
      "常用代码模式读取 `code-patterns`；更完整文档规则读取 `documentation`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "需要调整的函数职责、参数对象、条件命名和错误路径。",
      "早返回 / 请求对象 / 命名条件等重构建议。",
      "注释与文档的职责边界和剩余可读性风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "Go 代码风格模式",
      summary: "早返回、领域请求对象和复杂条件命名的 Go 代码示例。",
      loadWhen: "需要快速套用 Go 可读性重构模式时读取。",
    }),
    defineReference({
      id: "documentation",
      source: new URL("./references/documentation.md", import.meta.url),
      target: "references/documentation.md",
      title: "documentation.md",
      summary: "Go 代码风格规范：命名惯例、文件组织、注释要求与格式化规则。",
      loadWhen: "需要判断 Go 代码风格是否遵循工程惯例时读取。",
    }),
  ],
});
