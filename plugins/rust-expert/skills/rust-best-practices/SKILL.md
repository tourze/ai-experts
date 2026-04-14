---
name: rust-best-practices
description: 用于 Rust 代码编写、评审与重构；当任务涉及借用/所有权、错误边界、Clippy、性能、测试、文档，或“该不该 clone、unwrap、box、dyn Trait”这类取舍时触发。
---

# Rust Best Practices

## 适用场景

- 新写 Rust 模块、函数、trait 或类型时，需要先定借用/所有权边界。
- 代码评审或重构时，需要判断 `.clone()`、`unwrap()`、`Box`、`dyn Trait` 是否合理。
- 设计错误类型、测试策略、公共 API 文档与 lint 基线时。
- 性能优化任务需要先判断“应该改接口、改数据结构，还是先测量”时。
- 如果问题已经明确落在 Tokio 运行时、取消、`JoinSet`、channel 或 `Send + 'static`，切到 [rust-async-patterns](../rust-async-patterns/SKILL.md)。
- 需要更细的证据时按需读取参考章节，而不是一次性全读：
  - 借用/克隆：[`chapter_01.md`](references/chapter_01.md)
  - Clippy 与 lint：[`chapter_02.md`](references/chapter_02.md)
  - 性能：[`chapter_03.md`](references/chapter_03.md)
  - 错误处理：[`chapter_04.md`](references/chapter_04.md)
  - 测试：[`chapter_05.md`](references/chapter_05.md)
  - 泛型与分发：[`chapter_06.md`](references/chapter_06.md)
  - 类型状态：[`chapter_07.md`](references/chapter_07.md)
  - 注释与文档：[`chapter_08.md`](references/chapter_08.md)
  - 指针与并发语义：[`chapter_09.md`](references/chapter_09.md)

## 核心约束

- 默认优先借用而不是克隆。函数参数优先写成 `&str`、`&[T]`、`&Path`，除非调用方必须转移所有权。
- 生产代码禁止把 `unwrap()` / `expect()` 当控制流。测试、一次性脚本和进程启动阶段的 fail-fast 例外要写明原因。
- 库 crate 暴露稳定、可匹配的错误类型；应用二进制入口才适合聚合到 `anyhow` 这类兜底错误。
- 性能优化先测量再动刀：优先 `cargo clippy --all-targets --all-features --locked -- -D warnings`，必要时再 `cargo bench`、`cargo flamegraph`。
- 选择分发方式时，默认泛型静态分发；只有需要异构集合、插件边界或缩短编译时间时才转 `dyn Trait`。
- 注释只解释“为什么”；公共 API 文档解释“做什么、怎么用、失败条件是什么”。
- `TODO` 必须可追踪，例如 `// TODO(#42): 移除兼容分支`；没有 issue 的 TODO 视为未管理债务。

## 代码模式

### 1. 先把借用边界写进 API

```rust
#[derive(Debug)]
struct User {
    name: String,
}

fn display_name(user: &User) -> &str {
    user.name.as_str()
}

fn collect_names(users: &[User]) -> Vec<&str> {
    users.iter().map(display_name).collect()
}
```

### 2. 用显式错误类型表达失败原因

```rust
#[derive(Debug, PartialEq, Eq)]
enum ParsePortError {
    Empty,
    Invalid,
    OutOfRange(u16),
}

fn parse_port(raw: &str) -> Result<u16, ParsePortError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(ParsePortError::Empty);
    }

    let port = trimmed
        .parse::<u16>()
        .map_err(|_| ParsePortError::Invalid)?;

    if port == 0 {
        return Err(ParsePortError::OutOfRange(port));
    }

    Ok(port)
}
```

### 3. 用类型状态把非法顺序变成编译错误

```rust
use std::marker::PhantomData;

struct Draft;
struct Published;

struct Document<State> {
    body: String,
    _state: PhantomData<State>,
}

impl Document<Draft> {
    fn new(body: impl Into<String>) -> Self {
        Self {
            body: body.into(),
            _state: PhantomData,
        }
    }

    fn publish(self) -> Document<Published> {
        Document {
            body: self.body,
            _state: PhantomData,
        }
    }
}

impl Document<Published> {
    fn body(&self) -> &str {
        self.body.as_str()
    }
}
```

## 检查清单

- 入口参数是否还能再借用一层，而不是提早拿走所有权？
- 是否存在循环内 `clone()`、多余 `.collect()`、或“为了通过借用检查器而复制数据”的写法？
- 错误类型是否让调用方有机会恢复，还是被过早揉成字符串？
- 是否把 `#[allow(...)]` 用成了永久消音器？能否改成 `#[expect(...)]` 并写明原因？
- 测试名是否准确表达输入、条件与预期结果？
- 公共 API 是否具备 `///` 文档、`# Errors`/`# Panics`/`# Safety` 所需段落？
- 需要动态分发时，是否把装箱放在边界层，而不是核心热路径里？
- 如果评审点已经转向 async 运行时、锁跨 `await`、`Send`/`Sync`，跳到 [rust-async-patterns](../rust-async-patterns/SKILL.md)。

## 反模式

- 看到借用报错就直接 `.clone()`：这通常是在掩盖 API 边界设计错误。
- 在库代码里大量返回 `anyhow::Result<_>`：调用方无法稳定匹配错误类别。
- 用 `panic!`、`unwrap()` 代替输入校验：短期省事，长期把恢复策略推给线上。
- 未测量就“性能重构”：很容易把可读性换成了毫无收益的复杂度。
- 把注释写成代码翻译：`// increment i` 没价值，`// SAFETY:` 或设计权衡才有价值。
- 为了省事把所有 trait 都做成 `dyn Trait`：会同时损失内联机会、类型信息和可优化空间。
