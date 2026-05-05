# go-structs-interfaces

## 适用场景

- 设计或审查接口：大小、定义位置、方法集、与泛型的取舍。
- 结构体组合：embedding vs 命名字段、零值可用、field tag。
- Receiver 选择：pointer vs value、一致性、noCopy 模式。
- 类型断言、type switch、compile-time interface check。

涉及 nil interface trap 时配合 [go-safety](../go-error-handling/SKILL.md)；涉及接口/类型命名时配合 [go-naming](../go-code-style/SKILL.md)。

## 核心约束

| 类别 | 规则 | 示例 |
|------|------|------|
| 接口设计 | 函数接受接口，返回结构体 | `func NewClient() *Client`，参数用 `io.Reader` |
| 接口粒度 | 小接口，单方法加 `-er` 后缀；通过组合扩展 | `type Reader interface { Read(...) }` |
| 接口归属 | 在消费方定义，不在提供方定义 | `package http` 定义 `Handler`，`package sql` 定义 `driver.Driver` |
| 零值可用 | 设计结构体使 `var s T` 可直接使用 | `sync.Mutex{}`，避免 `NewX()` 才能用 |
| 类型断言 | 始终用 `value, ok := x.(T)` | 避免运行时 panic |
| Compile-time 检查 | `var _ Interface = (*Type)(nil)` | 编译期断言实现关系 |
| Embedding | 用于组合与方法提升，不是继承 | `type Server struct { http.Server }` 提升 `ListenAndServe` |
| Embedding 判定 | 只在想提升方法时 embed，否则用命名字段 | 仅暴露行为时 embed |
| Receiver 一致性 | 同一类型所有方法统一 pointer 或 value | 不要混用 |
| Value receiver | 小结构体、不可变语义、无副作用 | `func (p Point) Dist() float64` |
| Pointer receiver | 需要修改状态、结构体较大、含 `sync.Mutex` 等 | `func (c *Cache) Get(k string) V` |
| noCopy | 内嵌 `sync.Mutex` 让 `go vet` 检测复制 | `type Foo struct { mu sync.Mutex }` |
| 泛型约束 | 使用最紧约束，不用 `any` | 用 `comparable` 而非 `any` 作约束 |
| Field tags | `json` 用 snake_case，`db` 用 snake_case | `` `json:"user_name" db:"user_name"` `` |

## 常见错误

| 错误 | 修复 | 说明 |
|------|------|------|
| 提供方定义大接口 | 在消费方按需定义小接口 | 提供方接口膨胀导致实现困难 |
| `x.(T)` 不检查 ok | `v, ok := x.(T)` | 断言失败直接 panic |
| 混用 value/pointer receiver | 统一一种；有修改需求就用 pointer | 编译期不报错但语义混乱 |
| embedding 用于"is-a"关系 | embedding 是组合，没有多态分派 | Go 没有 IS-A，只有方法提升 |
| 泛型参数用 `any` | 用最紧类型约束 | `any` 放弃编译期类型安全 |
| `var _ = Type{}` 做检查 | `var _ I = (*T)(nil)` | 前者只检查字面量，后者检查接口实现 |
| 零值不可用但不提供文档 | 构造器初始化或文档标注 `// MUST call NewX()` | `go vet` + noCopy 只能部分覆盖 |
| struct tag 随意大小写 | `json`/`db` 统一 snake_case | 不一致会导致序列化/ORM 映射失败 |

## 深度参考

- [composition.md](references/composition.md) — embedding 模式、方法提升、接口组合、菱形问题规避。
