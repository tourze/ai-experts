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
