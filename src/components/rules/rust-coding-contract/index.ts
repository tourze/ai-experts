import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const rustCodingContractRule = defineRule({
  id: "rust-coding-contract",
  title: "Rust Coding Contract",
  description: "读写 Rust 源码、Cargo workspace、测试或 Clippy 配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- 默认借用而不是克隆；参数优先 `&str`、`&[T]`、`&Path`，循环或热路径里的 `clone()` / `collect()` 必须有必要性说明。",
      "- 生产代码不把 `unwrap()` / `expect()` 当控制流；库 crate 暴露稳定可匹配错误类型，应用入口才用 anyhow 兜底。",
      "- 默认泛型静态分发；只有异构集合、插件边界或编译时间压力明确时才用 `dyn Trait`，并检查 object safety。",
      "- async 任务必须有所有者、取消路径和并发上限；`tokio::spawn` 需要 `Send + 'static`，阻塞 IO / CPU 工作用 `spawn_blocking`，锁不要跨 `await`。",
      "- 每个 `unsafe` 块必须有 `SAFETY` 注释说明不变量；FFI 入口要处理 panic 边界、内存所有权和配对释放函数。",
      "- 性能判断只看 release 模式和可复现 benchmark/profile；优化顺序是算法/数据结构、API 边界、分配策略、最后微技巧。",
      "- 测试名表达输入、条件和预期；公共 API 补 rustdoc，涉及错误、panic 或 unsafe 的 API 要有 `# Errors` / `# Panics` / `# Safety` 段落。",
    ],
  }),
  paths: [
    "**/*.rs",
    "Cargo.toml",
    "Cargo.lock",
    "rust-toolchain",
    "rust-toolchain.toml",
    "clippy.toml",
    ".cargo/config.toml",
  ],
  priority: 60,
});
