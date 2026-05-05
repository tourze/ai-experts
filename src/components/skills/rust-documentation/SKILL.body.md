## 核心约束

- 注释只解释"为什么"；代码应该自解释"是什么"。
- `///` 文档解释"做什么、怎么用、失败条件"。
- 公共函数必须有文档；`# Errors` 列出返回 `Err` 的条件。
- `unsafe fn` 必须有 `# Safety` 段落说明调用方需满足的前置条件。
- 可能 panic 的函数必须有 `# Panics` 段落。
- `# Examples` 中的代码块是可执行的文档测试——必须能编译通过。
- 用 `//!` 写模块级文档，放在文件顶部。

## 文档段落速查

| 段落 | 何时需要 | 内容 |
|------|----------|------|
| 摘要行 | 所有公共项 | 一句话说明功能 |
| `# Examples` | 非显而易见的 API | 可运行的使用示例 |
| `# Errors` | 返回 `Result` 时 | 列出每种 `Err` 变体的触发条件 |
| `# Panics` | 可能 panic 时 | 说明触发 panic 的输入 |
| `# Safety` | `unsafe fn` | 调用方必须满足的不变量 |

代码示例见 [chapter_08.md](references/chapter_08.md)。

## 检查清单

- 公共 API 是否都有 `///` 文档？
- 返回 `Result` 的函数是否有 `# Errors`？
- `unsafe fn` 是否有 `# Safety`？
- 注释是否在解释"为什么"而不是翻译代码？
- 联动：[rust-ownership-idioms](../rust-ownership-idioms/SKILL.md) · [rust-testing](../rust-testing/SKILL.md)

## 反模式

### FAIL: 注释翻译代码

```rust
// increment i
i += 1;
// loop until done
while !done { ... }
```

### PASS: 注释解释 why

```rust
// 重试 3 次以应对短暂网络抖动；超过则视为持久故障
for _ in 0..3 {
    if try_request().is_ok() { break }
}
```

### FAIL: 空泛的 # Safety

```rust
/// # Safety
///
/// Caller must ensure safety.
pub unsafe fn raw_copy(src: *const u8, dst: *mut u8, len: usize) { ... }
```

### PASS: 列出具体不变量

```rust
/// # Safety
///
/// - `src` 必须指向至少 `len` 字节的有效已初始化内存
/// - `dst` 必须指向至少 `len` 字节的可写内存
/// - `src` 和 `dst` 不得重叠
/// - `len` 期间内存不得被其他线程修改
pub unsafe fn raw_copy(src: *const u8, dst: *mut u8, len: usize) { ... }
```

### FAIL: 缺 # Errors

```rust
/// 解析 URL
pub fn parse_url(s: &str) -> Result<Url, ParseError> { ... }
```

### PASS: 列出错误条件

```rust
/// 解析 URL
///
/// # Errors
///
/// - `ParseError::EmptyHost`：URL 缺少 host 部分
/// - `ParseError::InvalidScheme`：scheme 不在 [http, https, ftp]
/// - `ParseError::InvalidPort`：端口超出 0-65535
pub fn parse_url(s: &str) -> Result<Url, ParseError> { ... }
```
