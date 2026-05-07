import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const goStructsInterfacesSkill = defineSkill({
  id: "go-structs-interfaces",
  fullName: "go-structs-interfaces",
  description: "当 Go 代码涉及接口设计、结构体组合、embedding、泛型 vs any、receiver 选择、零值可用或 type assertion 时使用。",
  useCases: [
    "设计或审查接口：大小、定义位置、方法集、与泛型的取舍。",
    "结构体组合：embedding vs 命名字段、零值可用、field tag。",
    "Receiver 选择：pointer vs value、一致性、noCopy 模式。",
    "类型断言、type switch、compile-time interface check。",
  ],
  constraints: [
    "| 类别 | 规则 | 示例 |\n|------|------|------|\n| 接口设计 | 函数接受接口，返回结构体 | `func NewClient() *Client`，参数用 `io.Reader` |\n| 接口粒度 | 小接口，单方法加 `-er` 后缀；通过组合扩展 | `type Reader interface { Read(...) }` |\n| 接口归属 | 在消费方定义，不在提供方定义 | `package http` 定义 `Handler`，`package sql` 定义 `driver.Driver` |\n| 零值可用 | 设计结构体使 `var s T` 可直接使用 | `sync.Mutex{}`，避免 `NewX()` 才能用 |\n| 类型断言 | 始终用 `value, ok := x.(T)` | 避免运行时 panic |\n| Compile-time 检查 | `var _ Interface = (*Type)(nil)` | 编译期断言实现关系 |\n| Embedding | 用于组合与方法提升，不是继承 | `type Server struct { http.Server }` 提升 `ListenAndServe` |\n| Embedding 判定 | 只在想提升方法时 embed，否则用命名字段 | 仅暴露行为时 embed |\n| Receiver 一致性 | 同一类型所有方法统一 pointer 或 value | 不要混用 |\n| Value receiver | 小结构体、不可变语义、无副作用 | `func (p Point) Dist() float64` |\n| Pointer receiver | 需要修改状态、结构体较大、含 `sync.Mutex` 等 | `func (c *Cache) Get(k string) V` |\n| noCopy | 内嵌 `sync.Mutex` 让 `go vet` 检测复制 | `type Foo struct { mu sync.Mutex }` |\n| 泛型约束 | 使用最紧约束，不用 `any` | 用 `comparable` 而非 `any` 作约束 |\n| Field tags | `json` 用 snake_case，`db` 用 snake_case | `` `json:\"user_name\" db:\"user_name\"` `` |",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "提供方定义大接口。",
      pass: "在消费方按需定义小接口。提供方接口膨胀导致实现困难。",
    }),
    defineAntiPattern({
      fail: "`x.(T)` 不检查 ok。",
      pass: "用 `v, ok := x.(T)`。断言失败直接 panic。",
    }),
    defineAntiPattern({
      fail: "混用 value/pointer receiver。",
      pass: "统一一种；有修改需求就用 pointer。编译期不报错但语义混乱。",
    }),
    defineAntiPattern({
      fail: 'embedding 用于\"is-a\"关系。',
      pass: "embedding 是组合，没有多态分派。Go 没有 IS-A，只有方法提升。",
    }),
    defineAntiPattern({
      fail: "泛型参数用 `any`。",
      pass: "用最紧类型约束。`any` 放弃编译期类型安全。",
    }),
    defineAntiPattern({
      fail: "`var _ = Type{}` 做检查。",
      pass: "用 `var _ I = (*T)(nil)`。前者只检查字面量，后者检查接口实现。",
    }),
    defineAntiPattern({
      fail: "零值不可用但不提供文档。",
      pass: "构造器初始化或文档标注 `// MUST call NewX()`。`go vet` + noCopy 只能部分覆盖。",
    }),
    defineAntiPattern({
      fail: "struct tag 随意大小写。",
      pass: "`json`/`db` 统一 snake_case。不一致会导致序列化/ORM 映射失败。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认结构体所有权、零值语义、消费方接口、receiver 一致性和泛型约束。",
      "函数接受小接口、返回具体结构体；接口在消费方定义；小接口命名用行为后缀。",
      "结构体尽量零值可用，pointer / value receiver 不混用，泛型约束保持最窄。",
      "实现要点读取 `implementation-guide`；组合细节读取 `composition`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "struct 字段、零值语义、receiver 策略和 interface 边界建议。",
      "泛型约束、组合方式和测试替身设计。",
      "API 泄漏、过度抽象或 nil / copy 风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "implementation-guide",
      source: new URL("./references/implementation-guide.md", import.meta.url),
      target: "references/implementation-guide.md",
      title: "Go structs/interfaces 实现要点",
      summary: "接受接口返回结构体、消费方接口、零值可用、receiver 一致性和最窄泛型约束规则。",
      loadWhen: "需要快速审查 Go struct/interface API 边界时读取。",
    }),
    defineReference({
      id: "composition",
      source: new URL("./references/composition.md", import.meta.url),
      target: "references/composition.md",
      title: "composition.md",
      summary: "Go 结构体组合模式：embedding 策略、方法提升与命名字段的选择原则。",
      loadWhen: "需要设计或审查结构体组合、embedding 与零值可用性时读取。",
    }),
  ],
});
