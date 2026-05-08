# 第 7 章 - 类型状态模式

在编译时对状态建模，通过使非法状态不可表示来防止错误。它利用 Rust 的泛型和类型系统创建子类型，这些子类型只有在满足特定条件时才能达到，使得某些操作在编译时就非法。

> 最近它已成为 Rust 编程的标准设计模式。然而，它并非 Rust 独有，因为它也是可实现的，并且启发了其他语言：[swift](https://swiftology.io/articles/typestate/) 和 [typescript](https://catchts.com/type-state)。

## 7.1 什么是类型状态模式？

**类型状态模式**是一种设计模式，它将系统的不同**状态**编码为**类型**，而不是运行时标志或 enum。这使得编译器能够强制状态转换，并在编译时防止非法操作。它还改善了开发者体验，因为开发者只能根据类型的状态访问某些函数。

> 无效状态成为编译错误，而非运行时缺陷。

## 7.2 为什么要使用它？

* 避免运行时检查状态有效性。如果你达到某些状态，可以对拥有的数据做出某些假设。
* 将状态转换建模为类型转换。这类似于状态机，但在编译时。
* 防止数据误用，例如使用未初始化的对象。
* 提高 API 安全性和正确性。
* phantom data 字段在编译后被移除，因此不会分配额外内存。

## 7.3 简单示例：文件状态

[Github 示例](https://github.com/apollographql/rust-best-practices/tree/main/examples/simple-type-state)
```rust
use std::{io, path::{Path, PathBuf}};

struct FileNotOpened;
struct FileOpened;

#[derive(Debug)]
struct File<State> {
    /// 打开文件的路径
    path: PathBuf,
    /// 打开的 `File` 处理器
    handle: Option<std::fs::File>,
    /// 类型状态管理器
    _state: std::marker::PhantomData<State>
}

impl File<FileNotOpened> {
    /// `open` 是该 struct 的唯一入口点。
    /// * 当使用有效路径调用时，它将返回一个带有有效 `handler` 和 `path` 的 `File<FileOpened>`
    /// * `open` 作为 `new` 和 `defaults` 方法的替代（当你的 struct 需要有效数据才能存在时使用）。
    fn open(path: &Path) -> io::Result<File<FileOpened>> {
        // 如果文件无效，将返回 `std::io::Error`
        let file = std::fs::File::open(path)?;
        Ok(
            File {
                path: path.to_path_buf(),
                // 始终有效
                handle: Some(file),
                _state: std::marker::PhantomData::<FileOpened>
            }
        )
    }
}

impl File<FileOpened> {
    /// 将 `File` 的内容读取为 `String`。
    /// `read` 只能由状态 `File<FileOpened>` 调用
    fn read(&mut self) -> io::Result<String> {
        use io::Read;

        let mut content = String::new();
        let Some(handle)= self.handle.as_mut() else {
            unreachable!("Safe to unwrap as state can only be reached when file is open");
        };
        handle.read_to_string(&mut content)?;
        Ok(content)
    }

    /// 返回有效的路径缓冲区。
    fn path(&self) -> &PathBuf {
        &self.path
    }
}
```

## 7.4 真实世界示例

### 带编译时保证的构建器模式

> 强制用户在调用 `.build()` 之前**设置必填字段**。

[Github 示例](https://github.com/apollographql/rust-best-practices/tree/main/examples/type-state-builder)

类型状态模式可以有多个关联状态：

```rust
use std::marker::PhantomData;

struct MissingName;
struct NameSet;
struct MissingAge;
struct AgeSet;

#[derive(Debug)]
struct Person {
    name: String,
    age: u8,
    email: Option<String>,
}

struct Builder<NameState, AgeState> {
    name: Option<String>,
    age: u8,
    email: Option<String>,
    _name_marker: PhantomData<NameState>,
    _age_marker: PhantomData<AgeState>,
}

impl Builder<MissingName, MissingAge> {
    fn new() -> Self {
        Builder { name: None, age: 0, _name_marker: PhantomData, _age_marker: PhantomData, email: None }
    }

    fn name(self, name: String) -> Builder<NameSet, MissingAge> {
        Builder { name: Some(name), _name_marker: PhantomData::<NameSet>, age: self.age, _age_marker: PhantomData, email: None }
    }

    fn age(self, age: u8) -> Builder<MissingName, AgeSet> {
        Builder { age, _age_marker: PhantomData::<AgeSet>, name: None, _name_marker: PhantomData, email: None }
    }
}

impl Builder<NameSet, MissingAge> {
    fn age(self, age: u8) -> Builder<NameSet, AgeSet> {
        Builder { age, _age_marker: PhantomData::<AgeSet>, name: self.name, _name_marker: PhantomData::<NameSet>, email: None }
    }
}

impl Builder<MissingName, AgeSet> {
    fn email(self, email: String) -> Self {
        Self { name: self.name , age: self.age , email: Some(email) , _name_marker: self._name_marker , _age_marker: self._age_marker }
    }

    fn name(self, name: String) -> Builder<NameSet, AgeSet> {
        Builder { name: Some(name), _name_marker: PhantomData::<NameSet>, age: self.age, _age_marker: PhantomData::<AgeSet>, email: self.email }
    }
}

impl Builder<NameSet, AgeSet> {
    fn build(self) -> Person {
        Person { 
            name: self.name.unwrap_or_else(|| unreachable!("Name is guarantee to be set")), 
            age: self.age,
            email: self.email,
        }
    }
}
```

虽然比普通的构建器冗长一些，但这保证了所有必要字段都存在（注意 email 是仅在最终构建器中存在的可选字段）。

#### 用法：
```rust
// ✅ 有效情况
let person: Person = Builder::new().name("name".to_string()).age(30).build();
let person: Person = Builder::new().age(30).name("name".to_string()).build();
let person: Person = Builder::new().age(30).name("name".to_string()).email("myself@email.com".to_string()).build();

// ❌ 无效情况
let person: Person = Builder::new().name("name".to_string()).build(); // ❌ 编译错误：`build` 需要 Age
let person: Person = Builder::new().age(30).build(); // ❌ 编译错误：`build` 需要 Name
let person: Person = Builder::new().age(30).email("myself@email.com".to_string()).build(); // ❌ 编译错误：`build` 需要 Name
let person: Person = Builder::new().build();// ❌ 编译错误：`build` 需要 Name 和 Age
```

### 网络协议状态机

非法的转换，如在连接之前发送消息，**根本不会编译**：

```rust
// Mock 示例
struct Disconnected;
struct Connected;

struct Client<State> {
    stream: Option<std::net::TcpStream>,
    _state: std::marker::PhantomData<State>
}

impl Client<Disconnected> {
    fn connect(addr: &str) -> std::io::Result<Client<Connected>> {
        let stream = std::net::TcpStream::connect(addr)?;
        Ok(Client {
            stream: Some(stream),
            _state: std::marker::PhantomData::<Connected>
        })
    }
}

impl Client<Connected> {
    fn send(&mut self, msg: &str) {
        use std::io::Write;
        let Some(stream) = self.stream.as_mut() else {
            unreachable!("Stream is guarantee to be set");
        };
        stream.write_all(msg.as_bytes())
    }
}
```

## 7.5 优缺点

### ✅ 使用类型状态模式当：
* 你想要**编译时状态安全**。
* 你需要强制**API 约束**。
* 你在编写一个严重依赖变体的库/crate。
* 你想用**类型安全的代码路径**替换运行时布尔值或 enum。
* 你需要编译时正确性。

### ❌ 避免它当：
* 处理琐碎的状态，如 enum。
* 不需要类型安全。
* 当它导致过度复杂的泛型时。
* 当需要运行时灵活性时。

### 🚨 缺点和注意事项
* 可能导致更**冗长的解决方案**。
* 可能导致**复杂的类型签名**。
* 可能需要**unsafe**来根据不同状态返回**变体输出**。
* 可能需要大量重复（例如，重复使用相同的 struct 字段）。
* PhantomData 对初学者不直观，可能感觉有点 hacky。

> 当这个模式**节省缺陷、增加安全性或简化逻辑**时使用它，而不是仅仅为了炫技。
