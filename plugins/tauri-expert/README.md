# tauri-expert

Tauri 跨平台应用专家能力，覆盖 Tauri v2+ Rust 后端与 Web 前端开发。

## Skills

| Skill | 用途 |
|-------|------|
| `tauri-build-packaging` | 多平台构建打包：签名、公证、自动更新、资源绑定、CI/CD、二进制优化 |
| `tauri-ipc-patterns` | 高级 IPC 模式：自定义错误类型、判别联合事件、多窗口路由、权限定义、批量命令 |
| `tauri-plugin-development` | 自定义 Tauri 插件开发：脚手架、生命周期、平台分叉、状态管理、JS 绑定、权限 |
| `tauri-react-integration` | React + Tauri 集成：invoke hooks、事件监听、深链接路由、Rust-React 状态同步 |
| `tauri-v2` | Tauri v2+ 配置、Rust 后端、IPC、插件、安全 |

## Agents

| Agent | 用途 |
|-------|------|
| `tauri-engineer` | 当需要端到端设计或实现 Tauri v2 桌面应用时使用——覆盖项目搭建、IPC 命令设计、权限模型、React 前端集成、插件开发、构建打包与代码签名。 |
| `tauri-reviewer` | review Tauri IPC patterns, permission scoping, extension architecture, build configuration, and frontend-backend boundary design without modifying any files |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/tauri-expert/tests/*.test.mjs
```

建议同时安装 `rust-expert` 与 `typescript-expert`，用于 Rust 后端模式、异步并发、类型边界和前后端联调。
