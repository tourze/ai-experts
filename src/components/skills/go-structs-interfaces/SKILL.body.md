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
