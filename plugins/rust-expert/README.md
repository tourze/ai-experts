# rust-expert

Rust 开发专家插件，提供 12 个细粒度技能覆盖语言纪律、错误处理、测试、类型设计、性能、文档、异步、FFI、serde、过程宏、workspace 与运行时调优，以及 Edit|Write 后的调试语句与文件预算守卫。

## 目录

- `hooks/`：`hooks.json`、`dispatch.mjs` 和 1 个 PostToolUse 守卫
- `skills/`：12 个技能目录及其参考资料
- `tests/`：manifest 与 dispatch 回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `rust-ownership-idioms` | 借用/所有权/Clone/Copy、智能指针、Send/Sync、Clippy 纪律 |
| `rust-error-handling` | 错误类型设计、Result、thiserror、anyhow、? 操作符 |
| `rust-testing` | 测试命名、单元/集成/文档测试、snapshot、cargo-insta |
| `rust-type-design` | 泛型、静态/动态分发、trait object、类型状态模式 |
| `rust-performance` | 性能剖析、flamegraph、benchmark、分配优化 |
| `rust-documentation` | rustdoc、注释 vs 文档、# Safety/Errors/Panics |
| `rust-async-patterns` | Tokio 异步：JoinSet、channel、取消/超时、并发上限 |
| `rust-cargo-workspace` | Cargo workspace：共享依赖、feature flag、build.rs、CI 缓存 |
| `rust-ffi-bindings` | FFI：extern "C"、opaque handle、CStr/CString、cbindgen/uniffi |
| `rust-proc-macro-patterns` | 过程宏：derive/attribute macro、syn+quote、trybuild |
| `rust-serde-patterns` | Serde：tagged enum、字段演进、自定义 ser/de |
| `rust-tokio-runtime-tuning` | Tokio 运行时调优：worker 线程、blocking pool、metrics |

## Agents

| Agent | 用途 |
|-------|------|
| `rust-reviewer` | perform a Rust-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `debug-statement-guard` | 检测新增调试断点/调试输出；Rust 侧重点是 `dbg!()` |

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 安装

```bash
claude --plugin-dir /path/to/plugins/rust-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install rust-expert@ai-experts
claude plugin install rust-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall rust-expert
claude plugin uninstall rust-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
python3 -m json.tool plugins/rust-expert/hooks/hooks.json >/dev/null
find plugins/rust-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/rust-expert/tests/*.test.mjs
```
