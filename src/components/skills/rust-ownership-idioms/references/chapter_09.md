# 第 9 章 - 理解指针

许多高级语言隐藏了内存管理，通常**传值**（复制数据）或**传引用**（共享数据的引用），而无需担心分配、堆、栈、所有权和生命周期，这些都委托给垃圾收集器或虚拟机。以下是几种语言在该主题上的比较：

### 📌 语言对比

| 语言 | 值类型 | 引用/指针类型 | 异步模型和类型 | 手动内存管理 |
|------------ |------------------------------------- |----------------------------------------------------------- |---------------------------------------------------------------------------- |------------------------------ |
| Python | 无 | 一切都是引用 | async def, await, Task, coroutines 和 asyncio.Future | ❌ 不允许 |
| Javascript | 原始类型 | 对象 | `async/await`, `Promise`, `setTimeout`。单线程事件循环 | ❌ 不允许 |
| Java | 原始类型 | 对象 | `Future<T>`, 线程, Loom (绿色线程) | ❌ 几乎没有且不推荐 |
| Go | 除非使用 `&T` 否则值被复制 | 指针 (`*T`, `&T`), 逃逸分析 | goroutines, `channels`, `sync.Mutex`, `context.Context` | ⚠️ 有限 |
| C | 支持原始类型和 struct | 原始指针 `T*` 和 `*void` | 线程, 事件循环 (`libuv`, `libevent`) | ✅ 完全 |
| C++ | 原始类型和引用 | 原始 `T*` 和智能指针 `shared_ptr` 和 `unique_ptr` | 线程, `std::future`, `std::async`, (从 c++ 20 开始 `co_await/coroutines`) | ✅ 大部分 |
| Rust | 原始类型, 数组, `impl Copy` | `&T`, `&mut T`, `Box<T>`, `Arc<T>` | `async/await`, `tokio`, `Future`, `JoinHandle`, `Send + Sync` | ✅🔒 安全且显式 |

## 9.1 线程安全

Rust 使用 `Send` 和 `Sync` trait 跟踪指针：
- `Send` 表示数据可以跨线程移动。
- `Sync` 表示数据可以从多个线程引用。

> 指针仅在其背后的数据是线程安全时才安全。

| 指针类型 | 简要描述 | Send + Sync? | 主要用途 |
|---------------- |--------------------------------------------------------------------------- |-------------------------------------- |------------ |
| `&T` | 共享引用 | 是 | 共享访问 |
| `&mut T` | 独占可变引用 | 否，非 Send | 独占可变 |
| `Box<T>` | 堆分配的所有权指针 | 是，如果 T: Send + Sync | 堆分配 |
| `Rc<T>` | 单线程引用计数指针 | 否，两者都不是 | 多个所有者（单线程） |
| `Arc<T>` | 原子引用计数指针 | 是 | 多个所有者（多线程） |
| `Cell<T>` | 复制类型的内部可变性 | 否，非 Sync | 共享可变，非线程 |
| `RefCell<T>` | 内部可变性（动态借用检查器） | 否，非 Sync | 共享可变，非线程 |
| `Mutex<T>` | 带独占访问的线程安全内部可变性 | 是 | 共享可变，线程 |
| `RwLock<T>` | 线程安全共享只读访问或独占可变访问 | 是 | 共享可变，线程 |
| `OnceCell<T>` | 单线程一次性初始化容器（内部可变性 ONCE） | 否，非 Sync | 简单惰性值初始化 |
| `LazyCell<T>` | `OnceCell<T>` 的惰性版本，调用函数闭包来初始化 | 否，非 Sync | 复杂惰性值初始化 |
| `OnceLock<T>` | `OnceCell<T>` 的线程安全版本 | 是 | 多线程单次初始化 |
| `LazyLock<T>` | `LazyCell<T>` 的线程安全版本 | 是 | 多线程复杂初始化 |
| `*const T/*mut T` | 原始指针 | 否，用户必须手动确保安全 | 原始内存 / FFI |

## 9.2 何时使用指针：

### `&T` - 共享借用：

可能是 Rust 代码中最常见的类型，它是**安全的、不可变的**，允许**多个读取者**。

```rust
let data: String = String::from_str("this a string").unwrap();

print_len(&data);
print_capacity(&data);
print_bytes(&data);

fn print_len(s: &str) {
    println!("{}", s.len())
}

fn print_capacity(s: &String) {
    println!("{}", s.capacity())
}

fn print_bytes(s: &String) {
    println!("{:?}", s.as_bytes())
}
```

### `&mut T` - 独占借用：

可能是 Rust 代码中最常见的*可变*类型，它是**安全的，但一次只允许一个可变借用**。

```rust
let mut data: String = String::from_str("this a string").unwrap();
mark_update(&mut data);

fn mark_update(s: &mut String) {
    s.push_str("_update");
}
```

### [`Box<T>`](https://doc.rust-lang.org/std/boxed/struct.Box.html) - 堆分配

单一所有者的堆分配数据，非常适合递归类型和大型 struct。

```rust
pub enum MySubBoxedEnum<T> {
    Single(T),
    Double(Box<MySubBoxedEnum<T>>, Box<MySubBoxedEnum<T>>),
    Multi(Vec<T>), // 注意 Vec 本身已经是装箱值
}
```

### [`Rc<T>`](https://doc.rust-lang.org/std/rc/struct.Rc.html) - 引用计数（单线程）

你需要在单线程中多次引用数据。最常见的例子是链表实现。

### [`Arc<T>`](https://doc.rust-lang.org/std/sync/struct.Arc.html) - 原子引用计数（多线程）

你需要在多个线程中多次引用数据。最常见的用例是使用 `Arc<[T]>` 跨线程共享只读 Vec，以及包装 `Mutex` 以便在线程间轻松共享：`Arc<Mutex<T>>`。

### [`RefCell<T>`](https://doc.rust-lang.org/std/cell/struct.RefCell.html) - 运行时检查的内部可变性

当你需要共享访问和修改数据的能力时使用，借用规则在运行时强制执行。**它可能 panic！**。

```rust
use std::cell::RefCell;
let x = RefCell::new(42);
*x.borrow_mut() += 1;

assert_eq!(&*x.borrow(), 42, "Not meaning of life");
```

Panic 示例：
```rust
use std::cell::RefCell;
let x = RefCell::new(42);

let borrow = x.borrow();

let mutable = x.borrow_mut();
```

### [`Cell<T>`](https://doc.rust-lang.org/std/cell/struct.Cell.html) - 仅复制类型的内部可变性

某种程度上是 `RefCell` 的快速安全版本，但它仅限于实现 `Copy` trait 的类型：

```rust
use std::cell::Cell;

struct SomeStruct {
    regular_field: u8,
    special_field: Cell<u8>,
}

let my_struct = SomeStruct {
    regular_field: 0,
    special_field: Cell::new(1),
};

let new_value = 100;

// ERROR: `my_struct` 是不可变的
// my_struct.regular_field = new_value;

// WORKS: 虽然 `my_struct` 是不可变的，但 `special_field` 是 `Cell`，
// 它总是可以使用复制值进行修改
my_struct.special_field.set(new_value);
assert_eq!(my_struct.special_field.get(), new_value);
```

### [`Mutex<T>`](https://doc.rust-lang.org/std/sync/struct.Mutex.html) - 线程安全可变性

独占访问指针，允许一个线程读/写包含在内部的数据。它通常包裹在 `Arc` 中以允许共享访问 Mutex。

### [`RwLock<T>`](https://doc.rust-lang.org/std/sync/struct.RwLock.html) - 线程安全可变性

类似于 `Mutex`，但它允许多个线程读取或单个线程写入。它通常包裹在 `Arc` 中以允许共享访问 RwLock。

### [`*const T/*mut T`](https://doc.rust-lang.org/std/primitive.pointer.html) - 原始指针

本质上**不安全**，对于 FFI 是必需的。Rust 使其使用显式化，以避免意外滥用和不情愿的手动内存管理。

```rust
let x = 5;
let ptr = &x as *const i32;
unsafe {
    println!("PTR is {}", *ptr)
}
```

### [`OnceCell`](https://doc.rust-lang.org/std/cell/struct.OnceCell.html) - 单线程单次初始化容器

当你需要在多个数据结构之间共享配置时最有用。

```rust
use std::{cell::OnceCell, rc::Rc};

#[derive(Debug, Default)]
struct MyStruct {
    distance: usize,
    root: Option<Rc<OnceCell<MyStruct>>>, 
}

fn main() {
    let root = MyStruct::default();
    let root_cell = Rc::new(OnceCell::new());
    if let Err(previous) = root_cell.set(root) {
        eprintln!("Previous Root {previous:?}");
    }
    let child_1 = MyStruct{
        distance: 1,
        root: Some(root_cell.clone())
    };

    let child_2 = MyStruct{
        distance: 2,
        root: Some(root_cell.clone())
    };

    println!("Child 1: {child_1:?}");
    println!("Child 2: {child_2:?}");
}
```

### [`LazyCell`](https://doc.rust-lang.org/std/cell/struct.LazyCell.html) - `OnceCell` 的惰性初始化

当初始化数据可以延迟到实际被调用时非常有用。

### [`OnceLock`](https://doc.rust-lang.org/std/sync/struct.OnceLock.html) - 线程安全的 `OnceCell`

当你需要一个 `static` 值时非常有用。

```rust
use std::sync::OnceLock;

static CELL: OnceLock<u32> = OnceLock::new();

// `OnceLock` 尚未被写入。
assert!(CELL.get().is_none());

// 生成一个线程并写入 `OnceLock`。
std::thread::spawn(|| {
    let value = CELL.get_or_init(|| 12345);
    assert_eq!(value, &12345);
})
.join()
.unwrap();

// `OnceLock` 现在包含该值。
assert_eq!(
    CELL.get(),
    Some(&12345),
);
```

### [`LazyLock`](https://doc.rust-lang.org/std/sync/struct.LazyLock.html) - 线程安全的 `LazyCell`

类似于 `OnceLock`，但静态值的初始化稍微复杂一些。

```rust
use std::sync::LazyLock;

static CONFIG: LazyLock<HashMap<&str, T>> = LazyLock::new(|| {
    let data = read_config();
    let mut config: HashMap<&str, T> = data.into();
    config.insert("special_case", T::default());
    config
});

let _ = &*CONFIG;
```

## 参考
- [Mara Bos - Rust Atomics and Locks](https://marabos.nl/atomics/)
- [Semicolon video on pointers](https://www.youtube.com/watch?v=Ag_6Q44PBNs)
