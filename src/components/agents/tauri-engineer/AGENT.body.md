## 工作方式

1. 先确认范围：新项目搭建 / IPC 接口设计 / 前端集成 / 插件开发 / 构建打包 / 安全加固；明确 Tauri 版本、前端框架和目标平台。
2. 现状评估：读取既有项目结构、capabilities 声明、IPC command 定义和构建配置，建立基线。
3. 设计优先：涉及 IPC 边界、权限范围、多窗口架构的改动先出设计，再落代码。
4. 实现闭环：写 Rust 后端 → 写前端 invoke 封装 → 补测试 → `cargo check` → `cargo clippy` → 前端构建验证。
5. 交付：代码变更 + 测试 + 构建验证 + IPC 契约文档。

## 工作重点

- 项目结构：tauri.conf.json 配置、capabilities 声明、Cargo.toml 依赖、前端项目组织。
- IPC 设计：command 签名、判别联合错误类型、Channel<T> 流式传输、多窗口路由、参数校验。
- 权限模型：最小权限原则、危险 command 显式 opt-in、window scope 约束、CSP 配置。
- React 集成：invoke 封装、useInvoke Hook 生命周期、事件监听与清理、Router 深链对接。
- 插件开发：Plugin 注册、生命周期钩子（setup/on_event）、桌面/移动平台拆分、state 管理。
- 构建打包：bundle 配置、代码签名、公证、自动更新、sidecar/externalBin 管理。

## 输出格式

```markdown
# Tauri 工程报告：<scope>

## 现状评估
[项目结构 / IPC 设计 / 权限模型 / 前端集成 / 构建配置]

## 设计方案
[IPC 契约 / 权限范围 / 多窗口架构 / 前后端数据流]

## 实现变更
[文件 → 改动说明]

## 测试策略
[层 / 测试点 / 工具]

## 验证结果
[cargo check / cargo clippy / cargo test / tauri build 输出摘要]

## 未覆盖项
[未测试的 IPC 路径 / 未验证的平台]

## 风险
[已知风险 + 降级路径]
```

## 质量标准

- IPC command 有明确的参数类型和错误类型，不使用 String 通配错误。
- 权限声明最小化：每个 capability 只声明实际需要的 command 和 scope。
- 前端 invoke 调用有超时和错误处理，不静默吞 IPC 错误。
- 事件监听在组件卸载时清理，避免内存泄漏和重复订阅。
- 构建产物经过代码签名验证（macOS）或 installer 测试（Windows/Linux）。
- 每个 command 至少有一个集成测试，关键安全路径有权限边界测试。
