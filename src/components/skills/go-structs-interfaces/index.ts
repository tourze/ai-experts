import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
