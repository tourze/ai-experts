# Rust 分发与类型状态速查

## 分发决策树

```text
需要多态吗？
├── 否 -> 具体类型
└── 是 -> 类型在编译期确定？
    ├── 是 -> 泛型：impl Trait / <T: Trait>
    └── 否 -> Box<dyn Trait> / &dyn Trait
```

## 类型状态最小示例

```rust
use std::marker::PhantomData;

struct Draft;
struct Published;

struct Document<State> {
    body: String,
    _state: PhantomData<State>,
}

impl Document<Draft> {
    fn publish(self) -> Document<Published> {
        Document { body: self.body, _state: PhantomData }
    }
}
```

类型状态适合阶段数少且转换清晰的生命周期；阶段过多或运行时动态决定时优先枚举。
