## 智能指针速查

| 类型 | 所有权 | 线程安全 | 典型场景 |
|------|--------|----------|----------|
| `&T` / `&mut T` | 借用 | 取决于 `T` | 函数参数、短期访问 |
| `Box<T>` | 独占 | 取决于 `T` | 堆分配、递归类型、trait object |
| `Rc<T>` | 共享(单线程) | 否 | 单线程图/树、观察者 |
| `Arc<T>` | 共享(跨线程) | 是 | 跨 `tokio::spawn`、共享配置 |
| `Cell<T>` / `RefCell<T>` | 内部可变 | 否 | 单线程内部可变性 |
| `Mutex<T>` / `RwLock<T>` | 内部可变 | 是 | 跨线程共享可变状态 |

按需读取参考资料：
- 借用/克隆/迭代器惯用法：[chapter_01.md](references/chapter_01.md)
- Clippy 配置与重要 lint：[chapter_02.md](references/chapter_02.md)
- 指针类型与并发语义：[chapter_09.md](references/chapter_09.md)

## 检查清单

- 参数能否再借用一层而不是提早拿走所有权？
- 循环内的 `clone()` / `collect()` 是否必要？
- `#[allow(...)]` 是否都能改为 `#[expect(...)]` 并注明原因？

## 反模式

### FAIL: 借用报错就 clone

```rust
fn process(items: &Vec<String>) {
    let first = items[0].clone();  // 借用错误？clone！
    let copy = items.clone();       // 又借用错误？再 clone！
    do_stuff(copy);
}
// 热路径上每次调用复制整个 Vec → 性能崩
```

### PASS: 收紧 API 边界

```rust
fn process(items: &[String]) -> &str {  // 切片更通用
    &items[0]  // 借用即可
}
// 调用方决定是否需要 clone
```

### FAIL: unwrap 当控制流

```rust
let user = db.find_user(id).unwrap();  // 找不到就 panic
let token = req.header("auth").unwrap();  // 没 header 就 panic
// 线上事故：404 变成 500，错误堆栈污染日志
```

### PASS: ? + 显式错误

```rust
let user = db.find_user(id)?
    .ok_or(AppError::UserNotFound)?;
let token = req.header("auth")
    .ok_or(AppError::MissingAuth)?;
// 错误流可控，可在中间层处理
```

### FAIL: 全部 dyn Trait

```rust
fn process(handler: Box<dyn Handler>) { ... }  // 任何 Handler 都 box
// 失去内联、虚表跳转、堆分配
```

### PASS: 默认泛型

```rust
fn process<H: Handler>(handler: H) { ... }  // 静态分发
// 仅在异构集合 / 插件边界 / 编译时间真正成问题时才用 dyn Trait
```
