# 理解和改进 SwiftUI 性能（摘要）

背景：苹果关于使用 Instruments 诊断 SwiftUI 性能以及应用设计模式减少长时间或频繁更新的指南。

## 核心概念

- SwiftUI 是声明式的；视图更新由状态、环境和可观察数据依赖驱动。
- 视图主体必须快速计算以满足帧截止时间；缓慢或频繁的更新导致卡顿。
- Instruments 是查找长时间运行更新和过度更新频率的主要工具。

## Instruments 工作流

1. 通过 Product > Profile 进行 profiling。
2. 选择 SwiftUI 模板并记录。
3. 执行目标交互。
4. 停止记录并检查 SwiftUI 轨道 + Time Profiler。

## SwiftUI 时间线轨道

- Update Groups：SwiftUI 计算更新所花费的时间概览。
- Long View Body Updates：橙色 >500us，红色 >1000us。
- Long Platform View Updates：SwiftUI 中托管的 AppKit/UIKit。
- Other Long Updates：geometry/text/layout 和其他 SwiftUI 工作。
- Hitches：UI 未能及时准备好的帧缺失。

## 诊断长视图主体更新

- 展开 SwiftUI 轨道；检查模块特定的子轨道。
- 设置 Inspection Range 并与 Time Profiler 关联。
- 使用调用树或火焰图识别昂贵的帧。
- 重复更新以收集足够样本用于分析。
- 过滤到特定更新（Show Calls Made by `MySwiftUIView.body`）。

## 诊断频繁更新

- 使用 Update Groups 查找长时间活跃但无长时间更新的组。
- 在组上设置检查范围并分析更新计数。
- 使用 Cause 图（"Show Causes"）查看触发更新的原因。
- 比较原因与预期的数据流；优先处理最高频的原因。

## 修复模式

- 将昂贵的工作移出 `body` 并缓存结果。
- 使用 `Observable()` 宏将依赖范围限定为实际读取的属性。
- 避免将更新扇出到许多视图的宽泛依赖。
- 减少布局震荡；将依赖状态的子树与布局读取器隔离。
- 避免存储捕获父状态的闭包；预计算子视图。
- 使用阈值门控频繁更新（例如，geometry 变化）。

## 验证

- 更改后重新记录，以确认更新计数减少和卡顿减少。
