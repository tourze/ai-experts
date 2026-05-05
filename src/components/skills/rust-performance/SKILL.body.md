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
