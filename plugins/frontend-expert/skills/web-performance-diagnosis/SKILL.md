---
name: web-performance-diagnosis
description: 当用户要系统诊断 Web 前端性能瓶颈、建立性能预算、做跨层（网络→渲染→运行时）性能分析、审计网站质量、消除请求瀑布流或解决 hydration/浏览器渲染模式问题时使用。
---

# Web 性能诊断

系统化诊断 Web 前端性能瓶颈：网络层 → 渲染层 → 运行时。同时覆盖质量审计、请求瀑布流消除和浏览器渲染模式。与 [`core-web-vitals`](../core-web-vitals/SKILL.md) 互补。

## 适用场景

- 性能回归排查、跨层瓶颈定位、性能预算建立
- 质量审计（性能 / a11y / SEO / best practices）
- 请求瀑布流消除、Suspense 边界优化
- 浏览器渲染模式（hydration / resource hints / content-visibility / 事件监听）

## 核心约束

- 先看观测数据再下钻代码；禁止不看数据直接猜瓶颈。
- 区分场景：首屏 / 后续路由 / 交互 / 长会话，不混用结论。
- 区分 React 渲染问题与浏览器渲染问题。
- 区分 lab 数据与 RUM 数据，结论中显式标注口径。
- 审计结果按 P0/P1/P2 排序，每条附着验证方式。
- 瀑布流消除：先画依赖图，有依赖才串行，其余并行。
- Hydration 修复不能引入视觉闪烁；scroll/resize 必须 passive: true。

## 三段式诊断

### 第一段：网络层

关键资源链、资源优先级（preload/fetchpriority/defer/async）、CDN 缓存、字体策略、图片格式与 LCP 元素。

### 第二段：渲染层

LCP 四段分解、CLS 归因、layout thrash、paint storm、合成层失控、hydration 修复、content-visibility、script defer/async。

### 第三段：运行时

INP 三段分解、长任务、React re-render、Web Worker 边界、内存泄漏。

详细流程、性能预算模板、代码模式与完整反模式见 [references/diagnosis-detail.md](references/diagnosis-detail.md)。

## 质量审计

四维度（性能/a11y/SEO/best practices）全覆盖。快速 HTML 扫描：

```bash
node ./scripts/analyze.mjs ./public
```

问题分级与 AI 指纹检测详见 [references/quality-audit.md](references/quality-audit.md)。

## 瀑布流消除与浏览器渲染

核心代码模式（Promise.all 并行化、hydration 双阶段渲染、resource hints、passive listeners）和规则索引见 [references/rendering-and-waterfall.md](references/rendering-and-waterfall.md)。

## 检查清单

- [ ] 已覆盖性能、a11y、SEO、best practices 四维度。
- [ ] 问题按 P0/P1/P2 排序，每条指向具体页面/文件/元素。
- [ ] 已区分 lab 与 RUM 数据口径。
- [ ] LCP 四段分解、INP 三段分解是否完成？
- [ ] 无依赖请求已 Promise.all 并行化？
- [ ] hydration 无闪烁、scroll/resize 已 passive？
- [ ] 每条修复附着了验证方式。

## 交叉引用

- [`core-web-vitals`](../core-web-vitals/SKILL.md)：单项 CWV 指标深度优化
- [`bundle-optimization`](../bundle-optimization/SKILL.md)：代码分割、tree shaking
- [`react-performance`](../../../react-expert/skills/react-performance/SKILL.md)：React 渲染优化
- [`react-server-components`](../../../react-expert/skills/react-server-components/SKILL.md)：RSC 边界与 Server Actions
- [`frontend-design-review`](../frontend-design-review/SKILL.md)：前端界面与交互评审
