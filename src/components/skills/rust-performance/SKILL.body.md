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
