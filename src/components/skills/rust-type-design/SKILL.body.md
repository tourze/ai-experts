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
