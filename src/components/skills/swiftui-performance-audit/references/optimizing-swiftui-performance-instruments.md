# 使用 Instruments 优化 SwiftUI 性能（摘要）

背景：WWDC 会议介绍 Instruments 26 中新一代 SwiftUI Instrument，以及如何诊断 SwiftUI 特定的瓶颈。

## 关键要点

- 使用 SwiftUI 模板（SwiftUI instrument + Time Profiler + Hangs/Hitches）分析 SwiftUI 问题。
- 长视图主体更新是常见瓶颈；使用"Long View Body Updates"识别慢速主体。
- 在长时间更新上设置检查范围，并与 Time Profiler 关联以查找昂贵的帧。
- 将工作移出 `body`：将格式化、排序、图像解码和其他昂贵的工作移到缓存或预计算路径中。
- 使用 Cause & Effect Graph 诊断*为什么*发生更新；SwiftUI 是声明式的，因此回溯通常没有帮助。
- 避免触发许多更新的宽泛依赖（例如，`@Observable` 数组或全局环境读取）。
- 优先使用细粒度视图模型和限定范围的状态，以便仅受影响视图更新。
- 环境值更新检查仍需时间；避免将快速变化的值（计时器、geometry）放入环境。
- 在功能开发早期和经常进行 profiling，以捕获回归。

## 建议工作流（浓缩版）

1. 使用 SwiftUI 模板以 Release 模式记录 trace。
2. 检查"Long View Body Updates"和"Other Long Updates"。
3. 缩放至长时间更新，然后检查 Time Profiler 中的热点帧。
4. 通过将重逻辑移入预计算/缓存路径来修复慢速主体工作。
5. 使用 Cause & Effect Graph 识别非预期的更新扇出。
6. 重新记录并比较更新计数和卡顿频率。

## 会议中的示例模式

- 在 location manager 中缓存格式化距离字符串，而不是在 `body` 中计算。
- 将对全局收藏数组的依赖替换为逐项视图模型，以减少更新扇出。
