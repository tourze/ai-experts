# Rust 性能工具速查

| 工具 | 用途 | 命令 |
|------|------|------|
| Clippy | 静态分析性能 lint | `cargo clippy --all-targets` |
| cargo bench | 内置基准测试 | `cargo bench` |
| criterion | 统计基准测试 | 依赖 `criterion` crate |
| cargo flamegraph | 火焰图 | `cargo flamegraph` |
| perf / Instruments | 系统级 profiling | `perf record` / Xcode Instruments |
| DHAT | 堆分配分析 | `valgrind --tool=dhat` |

只用 release 模式性能数据做判断；没有 benchmark 基线时先补测量而不是重构。
