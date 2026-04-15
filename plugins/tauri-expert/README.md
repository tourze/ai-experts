# tauri-expert

Tauri 跨平台应用专家插件，覆盖 Tauri v2+ Rust 后端与 Web 前端开发。

## Skills

| Skill | 用途 |
|-------|------|
| `tauri-v2` | Tauri v2+ 配置、Rust 后端、IPC、插件、安全 |
| `tauri-ipc-patterns` | 高级 IPC 模式：自定义错误类型、判别联合事件、多窗口路由、权限定义、批量命令 |
| `tauri-plugin-development` | 自定义 Tauri 插件开发：脚手架、生命周期、平台分叉、状态管理、JS 绑定、权限 |
| `tauri-build-packaging` | 多平台构建打包：签名、公证、自动更新、资源绑定、CI/CD、二进制优化 |
| `tauri-react-integration` | React + Tauri 集成：invoke hooks、事件监听、深链接路由、Rust-React 状态同步 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/tauri-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install tauri-expert@ai-experts
claude plugin install tauri-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall tauri-expert
claude plugin uninstall tauri-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
claude plugin validate plugins/tauri-expert
```

建议同时安装 `rust-expert` 与 `typescript-expert`，用于 Rust 后端模式、异步并发、类型边界和前后端联调。
