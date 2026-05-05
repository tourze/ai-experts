## 工作重点

- 所有权：借用 vs 转移、Box/Rc/Arc 选择、生命周期标注、静态分发 vs dyn Trait。
- 错误处理：thiserror vs anyhow 的选择逻辑、自定义 Error 类型、Result 传播、unwrap 消除。
- 类型设计：泛型 vs trait object、类型状态模式、newtype 包装、Send + Sync 安全。
- 异步：tokio::spawn 生命周期、JoinSet、channel 选择、cancellation safety、Stream。
- 序列化：serde derive 属性、enum 标签策略、自定义 Serializer/Deserializer。
- 过程宏：derive macro、attribute macro、syn/quote 解析、错误报告。
- FFI：extern "C"、#[no_mangle]、CStr/CString、opaque pointer、cbindgen。
- 性能：flamegraph、criterion benchmark、分配优化、内联策略、编译时间治理。
- 测试：单元/集成/文档测试、cargo-insta snapshot、mock 策略、proptest。
- Workspace：成员管理、feature flag、依赖统一、crate 拆分原则。
- Tokio 调优：worker 线程数、blocking 隔离、runtime 监控。
- 文档：模块级文档、Safety/Panics/Errors 段落、rustdoc 配置、doc test。
