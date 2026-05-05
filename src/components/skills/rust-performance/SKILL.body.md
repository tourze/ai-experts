## 适用场景

- 需要定位 Rust 程序的性能瓶颈。
- 使用 `cargo bench`、`cargo flamegraph`、`criterion` 做基准测试。
- 判断"应该改接口、改数据结构，还是先测量"。
- 优化分配策略：栈 vs 堆、`Vec` 预分配、避免不必要的 `clone`。

## 核心约束

- **先测量再动刀**。没有 profile 数据的"性能优化"是猜测。
- 优化顺序：算法/数据结构 > API 边界 > 分配策略 > 微观技巧。
- `cargo clippy --all-targets --all-features -- -D warnings` 是免费的第一步。
- 迭代器链通常比手写循环更快（零开销抽象 + 编译器优化）。
- `#[inline]` 只在跨 crate 热路径上有意义；同 crate 内编译器自行决定。
- Release 模式 (`--release`) 下才有意义的性能数据；Debug 下不要做性能判断。

## 工具速查

| 工具 | 用途 | 命令 |
|------|------|------|
| Clippy | 静态分析性能 lint | `cargo clippy --all-targets` |
| cargo bench | 内置基准测试 | `cargo bench` |
| criterion | 统计基准测试 | 依赖 `criterion` crate |
| cargo flamegraph | 火焰图 | `cargo flamegraph` |
| perf / Instruments | 系统级 profiling | `perf record` / Xcode |
| DHAT | 堆分配分析 | `valgrind --tool=dhat` |

代码示例见 [chapter_03.md](references/chapter_03.md)。

## 检查清单

- 优化前是否有 benchmark 基线？
- 是否在 `--release` 模式下测量？
- 热路径上是否有不必要的 `clone()`、`collect()`、`format!()`？
- 联动：[rust-ownership-idioms](../rust-ownership-idioms/SKILL.md) · [rust-type-design](../rust-type-design/SKILL.md)

## 反模式

### FAIL: Debug 模式判断性能

```bash
cargo run         # debug 5s → "需要优化"
```

### PASS: Release 测量

```bash
cargo run --release   # release 0.2s（差 20-50 倍）
```

### FAIL: 未测量就重构

```rust
// "for 循环肯定比 iter 快"
for i in 0..items.len() { sum += items[i]; }
// 实际：iter 通常更快（边界检查省略 + 自动向量化）
```

### PASS: 先 benchmark 再决定

```rust
// criterion 对比两种写法，数据说话
```

### FAIL: 到处 #[inline(always)]

```rust
#[inline(always)] fn helper1() { ... }
#[inline(always)] fn helper2() { ... }
// 代码膨胀 → icache miss → 反而更慢
```

### PASS: 让编译器决定

```rust
fn helper() { ... }                       // 同 crate 自动 inline
#[inline] pub fn cross_crate_hot() { ... } // 跨 crate 热路径才标
```
