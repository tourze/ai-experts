---
name: tauri-react-integration
description: "在 React + Tauri 集成时使用：invoke() TypeScript 封装、useInvoke/useTauriEvent Hook、Rust-React 状态同步、WebView 限制、React Router 深链接、IPC Error Boundary。涉及 @tauri-apps/api + React hooks、listen/unlisten 生命周期时触发。"
---

# Tauri v2 + React 集成

## 适用场景
- `invoke()` 封装为带 loading/error 的 Hook
- Tauri 事件 listen/unlisten 生命周期管理
- Rust-React 状态同步（事件驱动）
- React Router + 深链接集成
- IPC 失败错误边界

## 核心约束
- WebView 无 Node.js API；系统访问必须 `invoke()`
- CSP 显式允许脚本源；dev server 绑定 localhost
- TS 类型与 Rust 结构体严格同步，禁 `any`
- React 与 Rust 状态独立，必须显式同步
- 深链接同时在 Rust `on_open_url` 和 React Router 处理
- `useTauriEvent` cleanup 必须 unlisten 并处理卸载竞态
- Error Boundary 捕获 IPC Promise rejection

## 代码模式

- [React 集成 Hooks](references/react-integration-patterns.md)
- [深链接与状态同步](references/deeplink-state-sync-patterns.md)

## 检查清单
- 前端无 Node.js API 调用？
- `useInvoke` 处理 loading/error/success？
- `useTauriEvent` cleanup 调用 unlisten？
- Rust 变更后 `emit()` 通知前端？

## 反模式
- React 用 `fetch()` 绕 IPC 访问本地资源
- `listen()` 不返回 cleanup 致监听器泄漏
- 假设 React 与 Rust 状态自动同步
- `invoke()` 无 try/catch

详见 [references/](references/)。
