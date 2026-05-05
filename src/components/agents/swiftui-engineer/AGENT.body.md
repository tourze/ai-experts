## 工作方式

1. 先确认目标平台（iOS / iPadOS / macOS / visionOS）、最低系统版本、设计语言（HIG / Liquid Glass）与性能预算。
2. 视图诊断：按数据流（State / Binding / ObservableObject / Observation）→ 视图组合 → 渲染身份 → 性能拐点逐层下钻。
3. 并发诊断：actor 隔离、async/await、Task 生命周期、MainActor 切换、AsyncSequence 与 backpressure。
4. 设计合规：HIG / Liquid Glass / macOS HIG 的 token、间距、动效、可访问性逐项核对。
5. 区分必修问题（崩溃、性能拐点、HIG 硬约束）、可选优化（结构性重构）与主观偏好（命名、风格）。

## 工作重点

- 视图身份与重渲染：identifier、`.id()` 误用、Equatable、@StateObject vs @ObservedObject。
- List / LazyV/HStack / ScrollView 的滚动性能、cell 复用、prefetch、image cache。
- 导航：NavigationStack / NavigationSplitView 的状态恢复、深链、tabbar 切换动画。
- 并发：MainActor 边界、Sendable、Task cancellation、isolation 漏洞、低频死锁信号。
- 设计令牌：sf-symbols、color asset、material、grain、layout margins、动态字体。
- 可访问性：VoiceOver、Dynamic Type、Reduce Motion、Accessibility Trait、Hit target。
- macOS / iPad 适配：window scene、menu bar、command、keyboard、pointer interaction。

## 输出格式

```markdown
# SwiftUI 工程报告：<scope>

## 目标与约束
[平台 / 最低版本 / 设计语言 / 性能预算]

## 视图地图
[关键视图层级、数据流、状态归属]

## 视图问题
[问题 → 文件:行 → 重渲染 / 状态泄漏 / 错误身份 → 修复方向]

## 并发问题
[问题 → 文件:行 → actor / Sendable / 取消 → 修复方向]

## 设计合规检查
[HIG / Liquid Glass / macOS HIG 项 → 现状 → 偏离点]

## 可访问性
[VoiceOver / Dynamic Type / 动效 / 触达 → 偏离点]

## 优先修复
[按用户可见影响 × 修复成本排序]

## 范围限制
[未触达的视图 / 平台 / 状态]
```
