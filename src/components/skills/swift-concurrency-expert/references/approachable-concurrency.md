## 平易近人的并发 (Swift 6.2) - 项目模式快速指南

当项目已选择使用 Swift 6.2 平易近人的并发设置（默认 actor 隔离 / 主 actor 默认）时，使用此参考。

## 检测模式

检查 Xcode 构建设置中的 "Swift Compiler - Concurrency"：
- Swift 语言版本（必须是 6.2+）。
- 默认 actor 隔离 / 主 actor 默认。
- 严格并发检查级别（Complete/Targeted/Minimal）。

对于 SwiftPM，检查 Package.swift 中的 swiftSettings 以获取相同的标志。

## 预期的行为变化

- 异步函数默认停留在调用方的 actor 上；除非实现选择，否则不会跳到全局并发执行器。
- 主 actor 默认减少 UI 绑定代码和全局状态的数据竞争错误，因为可变状态受到隐式保护。
- 协议遵循可以隔离（例如，`extension Foo: @MainActor Bar`）。

## 如何在此模式下应用修复

- 优先使用最小的注解；当代码是 UI 绑定时，让主 actor 默认为你工作。
- 使用隔离遵循而非强制使用 `nonisolated` 变通方法。
- 将全局或共享的可变状态保留在主 actor 上，除非有明确的性能需求需要卸载。

## 何时选择退出或卸载工作

- 在必须在并发池上运行的异步函数上使用 `@concurrent`。
- 仅当类型或成员真正线程安全且不在主 actor 上使用时，才将其设为 `nonisolated`。
- 当值跨越 actor 或任务时，继续尊重 Sendable 边界。

## 常见陷阱

- `Task.detached` 忽略继承的 actor 上下文；除非确实需要打破隔离，否则避免使用。
- 如果 CPU 密集型工作停留在主 actor 上，主 actor 默认可能隐藏性能问题；将该工作移到 `@concurrent` 异步函数中。

## 关键词（源自速查表）

| 关键词 | 作用 |
| --- | --- |
| `async` | 函数可以暂停 |
| `await` | 在此处暂停直到完成 |
| `Task { }` | 启动异步工作，继承上下文 |
| `Task.detached { }` | 启动异步工作，不继承上下文 |
| `@MainActor` | 在主线程上运行 |
| `actor` | 具有隔离可变状态的类型 |
| `nonisolated` | 选择退出 actor 隔离 |
| `Sendable` | 可在隔离域之间安全传递 |
| `@concurrent` | 始终在后台运行（Swift 6.2+） |
| `async let` | 启动并行工作 |
| `TaskGroup` | 动态并行工作 |

## 来源

https://fuckingapproachableswiftconcurrency.com/en/
