---
name: tauri-ipc-patterns
description: "在需要高级 IPC 模式时使用：自定义错误类型、判别联合事件、Channel<T> 流、权限定义、多窗口路由、二进制传输、批量命令。涉及 serde tag/content、tauri::ipc::Request、permissions/*.toml、emit_to 时触发。"
---

# Tauri v2 高级 IPC 模式

## 适用场景
- 自定义错误类型替代 `Result<T, String>`
- 判别联合事件、多窗口精确路由
- `Channel<T>` 高频推送、二进制零拷贝
- 自定义命令权限定义、批量命令优化

## 核心约束
- 错误类型必须 impl `serde::Serialize`，序列化为结构体非纯字符串
- 事件枚举用 `#[serde(tag = "event", content = "data")]`
- `Channel<T>` 单命令高频流；`emit()` 广播；`invoke()` 请求-响应
- 权限标识符遵循 `<plugin>:<action>-<command>` 约定
- 多窗口必须 `emit_to()` / `emit_filter()` 精确路由
- 二进制用 `tauri::ipc::Request/Response` 零拷贝
- 超 1ms 同步命令必须改 async
- 批量模式单次 invoke 传操作数组减少往返

## 代码模式

- [高级 IPC 模式](references/ipc-advanced-patterns.md)

## 检查清单
- 错误是否序列化为结构化 JSON？
- 事件枚举与前端 TS 类型一一对应？
- 权限文件在 `permissions/` 并被 capability 引用？

## 反模式
- 所有命令返回 `String` 错误
- 事件无判别字段靠猜测区分
- 多窗口 `emit()` 广播隐私数据
- 循环 N 次 invoke 不合并批量

详见 [references/](references/)。
