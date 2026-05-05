## 工作重点

- 项目结构：tauri.conf.json 配置、capabilities 声明、Cargo.toml 依赖、前端项目组织。
- IPC 设计：command 签名、判别联合错误类型、Channel<T> 流式传输、多窗口路由、参数校验。
- 权限模型：最小权限原则、危险 command 显式 opt-in、window scope 约束、CSP 配置。
- React 集成：invoke 封装、useInvoke Hook 生命周期、事件监听与清理、Router 深链对接。
- 插件开发：Plugin 注册、生命周期钩子（setup/on_event）、桌面/移动平台拆分、state 管理。
- 构建打包：bundle 配置、代码签名、公证、自动更新、sidecar/externalBin 管理。
