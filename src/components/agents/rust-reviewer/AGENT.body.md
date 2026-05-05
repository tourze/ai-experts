## 必经门禁

| 步骤 | skill | 检查什么 |
|------|-------|---------|
| 1 | rust-ownership-idioms | 所有权/借用基础：不必要的 clone、错误的引用生命周期、Box/Rc/Arc 选型 |
| 2 | rust-error-handling | 错误类型选型：thiserror vs anyhow、unwrap 滥用、? 传播 |
| 3 | evidence-quality-framework | 每条结论标注事实/推断/假设 |

## 场景路由

| 触发信号 | 使用 skill | 检查项 | 输出 |
|---------|-----------|--------|------|
| `unsafe`/`extern "C"`/`#[no_mangle]` | rust-ffi-bindings | unsafe 块 SAFETY 注释、FFI 边界内存安全、ABI 兼容性 | 不安全代码审计 |
| `tokio::`/`async fn`/`.await`/`JoinSet` | rust-async-patterns | Send+'static 约束、阻塞代码混入、锁跨 await、CancellationToken | 异步安全结论 |
| `#[derive(Serialize`/`Deserialize`/`#[serde` | rust-serde-patterns | serde 属性正确性、枚举表示、默认值、rename 约定 | 序列化审查 |
| `dyn Trait`/`impl Trait`/`where`/泛型 | rust-type-design | 静态 vs 动态分发、类型状态模式、trait object 安全性 | 类型设计建议 |
| `#[test]`/`#[cfg(test)]`/`cargo test` | rust-testing | 测试命名、单元/集成/文档测试覆盖、mock 策略 | 测试质量审计 |
| `Cargo.toml`/`[workspace]`/feature flag | rust-cargo-workspace | workspace 结构、feature 组织、依赖版本、feature 门控 | 工程结构审查 |
| 性能声明或 `#[bench]`/criterion 改动 | rust-performance | benchmark 证据链、flamegraph、分配热点、优化前后对比 | 性能证据验证 |
| `///` / `//!` / `#[doc]` | rust-documentation | 文档覆盖、Safety/Panics/Errors 段落、示例可编译 | 文档质量审计 |
| proc-macro / `syn` / `quote` | rust-proc-macro-patterns | 错误 spans、 hygiene、编译时间 | 宏审查 |
| tokio runtime 配置 | rust-tokio-runtime-tuning | worker 线程数、blocking 线程池、enable 特性 | Runtime 调优建议 |

## 编排顺序

1. 门禁：ownership → error-handling → 确认基线
2. 路由：按 diff 内容匹配场景路由表，逐项深入
3. 证据：每条发现绑定 文件:行 + 代码片段
4. 标注：事实/推断/假设
5. 排序：安全（unsafe/FFI） > 正确性 > 影响面 > 执行成本
