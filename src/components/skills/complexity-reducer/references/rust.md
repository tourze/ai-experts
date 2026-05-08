# Rust 精简模式

## 目录

1. [错误处理](#错误处理)
2. [迭代器模式](#迭代器模式)
3. [所有权与借用](#所有权与借用)
4. [类型设计](#类型设计)
5. [反模式](#反模式)

---

## 错误处理

### `?` 操作符代替 Match 链

```rust
// 改造前
fn read_config(path: &str) -> Result<Config, Error> {
    let file = match File::open(path) {
        Ok(f) => f,
        Err(e) => return Err(e.into()),
    };
    let contents = match read_to_string(file) {
        Ok(c) => c,
        Err(e) => return Err(e.into()),
    };
    Ok(parse(contents)?)
}

// 改造后
fn read_config(path: &str) -> Result<Config, Error> {
    let contents = std::fs::read_to_string(path)?;
    Ok(parse(&contents)?)
}
```

### 使用 `thiserror` 定义自定义错误类型

```rust
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("config not found: {path}")]
    ConfigNotFound { path: PathBuf },
    #[error("parse error at line {line}")]
    ParseError { line: usize, #[source] cause: serde_json::Error },
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
```

### 应用级用 `anyhow`，库级用 `thiserror`

应用代码使用 `anyhow::Result` 以简化。库应定义明确的错误类型。

---

## 迭代器模式

### 链式调用代替手工循环

```rust
// 改造前
let mut results = Vec::new();
for item in items {
    if item.is_active() {
        results.push(item.name().to_lowercase());
    }
}

// 改造后
let results: Vec<String> = items.iter()
    .filter(|item| item.is_active())
    .map(|item| item.name().to_lowercase())
    .collect();
```

### 嵌套迭代用 `flat_map`

```rust
let all_tags: Vec<&str> = posts.iter()
    .flat_map(|post| post.tags.iter())
    .map(|tag| tag.as_str())
    .collect();
```

### 累积用 `fold` / `reduce`

当 `.sum()`、`.product()`、`.min()`、`.max()` 可以直接用时优先使用。自定义累积再用 `.fold()`。

### 避免迭代器链中的 `.clone()`

如果在 `.map()` 里 clone，检查是否可以重构为借用。有时提前 `.collect()` 或修改返回类型可以消除 clone 需求。

---

## 所有权与借用

### 函数参数接受 `&str` 而非 `String`

除非函数需要持有字符串所有权：

```rust
fn greet(name: &str) -> String {        // 借用
    format!("Hello, {name}")
}
fn store_name(name: String) { ... }      // 获取所有权——调用方决定何时 clone
```

### 参数位置使用 `impl Trait`

优先使用 `impl AsRef<Path>` 而非 `&Path` 以获得更大灵活性：

```rust
fn read_file(path: impl AsRef<Path>) -> io::Result<String> {
    std::fs::read_to_string(path)
}
```

### 条件所有权用 Cow

```rust
fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains(' ') {
        Cow::Owned(input.replace(' ', "_"))
    } else {
        Cow::Borrowed(input)
    }
}
```

---

## 类型设计

### Newtype 模式

防止原始类型痴迷，让类型系统为你工作：

```rust
struct UserId(u64);
struct OrderId(u64);
// 这是不同的类型——不会意外地在需要 OrderId 的地方传入 UserId
```

### 复杂构造用 Builder 模式

当结构体有超过 3 个可选字段时，用 builder 替代大量 `new_with_*` 变体。

### `From` / `Into` 用于类型转换

实现 `From<A> for B` 会自动获得 `Into<B> for A`。错误类型转换和 newtype 解包的习惯用法。

### 枚举状态机

将合法状态编码为枚举变体。非法转换变成编译错误：

```rust
enum Connection {
    Disconnected,
    Connecting { attempt: u32 },
    Connected { session: Session },
}
```

---

## 反模式

| 反模式 | 修复方案 |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| 库代码中 `.unwrap()` | 返回 `Result` 或 `Option` |
| 不理解原因就用 `.clone()` 满足借用检查器 | 重构生命周期，或使用 `Rc`/`Arc`（如果确实需要共享所有权） |
| 始终是静态的 struct 字段用 `String` | 使用 `&'static str` 或 `Cow<'static, str>` |
| 库错误类型中 `Box<dyn Error>` | 使用 `thiserror` 枚举 |
| 手工 `impl Display` + `impl Error` | 使用 `thiserror` derive |
| 默认并发模式 `Arc<Mutex<Vec<T>>>` | 考虑 channel、`dashmap`，或重新设计减少共享 |
| 调用方需要存储时返回 `impl Iterator` | 返回具体类型或 `Box<dyn Iterator>` |
