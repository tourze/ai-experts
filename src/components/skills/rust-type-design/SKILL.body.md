## 适用场景

- 选择泛型（静态分发）还是 `dyn Trait`（动态分发）。
- 设计 trait object 的 object safety 约束。
- 用类型状态模式（typestate）把非法操作顺序变成编译错误。
- 在编译时间、二进制大小和运行时性能之间做权衡。

## 核心约束

- 默认泛型静态分发——零开销、可内联、类型信息完整。
- 只在真正需要异构集合、插件边界或缩短编译时间时转 `dyn Trait`。
- `dyn Trait` 要求 trait 是 object-safe（无泛型方法、不返回 `Self`）。
- 类型状态适合有明确生命周期阶段的实体（Draft → Published、Connecting → Connected）。
- 类型状态不适合阶段太多或需要运行时动态决定的场景——此时用枚举。

## 分发决策树

```
需要多态吗？
├── 否 → 具体类型
└── 是 → 类型在编译期确定？
    ├── 是 → 泛型 (impl Trait / <T: Trait>)
    └── 否 → Box<dyn Trait> / &dyn Trait
```

## 类型状态速查

```rust
struct Draft;
struct Published;

struct Document<State> {
    body: String,
    _state: PhantomData<State>,
}

impl Document<Draft> {
    fn publish(self) -> Document<Published> { /* ... */ }
}
// Document<Published> 没有 publish()——编译错误
```

详细示例见：
- 泛型与分发：[chapter_06.md](references/chapter_06.md)
- 类型状态模式：[chapter_07.md](references/chapter_07.md)

## 检查清单

- 用了 `dyn Trait` 的地方，是否真的需要运行时多态？
- trait 是否 object-safe？是否意外加了泛型方法？
- 类型状态的阶段数是否可控（<5）？
- 联动：[rust-ownership-idioms](../rust-ownership-idioms/SKILL.md) · [rust-performance](../rust-performance/SKILL.md)

## 反模式

### FAIL: 默认 dyn 放弃零开销

```rust
fn process(h: Box<dyn Handler>) { h.run(); }
// 每次走 vtable，失去内联
```

### PASS: 默认泛型

```rust
fn process<H: Handler>(h: H) { h.run(); }
// 编译期单态化，零开销
// 只有真正需要异构集合才改 Vec<Box<dyn Handler>>
```

### FAIL: trait 方法带泛型

```rust
trait Storage {
    fn get<T: DeserializeOwned>(&self, key: &str) -> T;  // 无法 dyn
}
let s: Box<dyn Storage> = ...;  // 编译错误
```

### PASS: 保持 object-safe

```rust
trait Storage {
    fn get(&self, key: &str) -> Vec<u8>;
}
let s: Box<dyn Storage> = ...;  // OK
```
