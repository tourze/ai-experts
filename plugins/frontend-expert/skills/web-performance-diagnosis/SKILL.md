---
name: web-performance-diagnosis
description: 当用户要系统诊断 Web 前端性能瓶颈、建立性能预算或做跨层（网络→渲染→运行时）性能分析时使用。提供三段式定位方法和性能预算驱动的优先级排序，区分 lab 与 RUM 数据口径。
---

# Web 性能诊断

系统化诊断 Web 前端性能瓶颈的三段式方法：网络层 → 渲染层 → 运行时。与 [`core-web-vitals`](../core-web-vitals/SKILL.md) 互补：CWV 技能解决单个指标的优化，本 skill 解决跨层瓶颈定位和修复优先级排序。

## 适用场景

- 性能回归排查：上线后 LCP/INP/CLS 恶化，需要定位根因
- 新项目性能预算建立：定义各层的阈值和监控口径
- 跨层瓶颈定位：不确定瓶颈在网络、渲染还是 JS 执行
- 性能审计：系统化产出性能报告和修复路线

## 核心约束

- 先看观测数据再下钻代码；禁止不看数据直接猜瓶颈。
- 区分场景：首屏 / 后续路由 / 交互 / 长会话；不同场景的瓶颈不同，不混用结论。
- 区分 React 渲染问题（re-render / memo / context）与浏览器渲染问题（layout / paint / composite）。
- 区分 lab 数据（Lighthouse / WebPageTest）与 RUM 数据（真实用户）；结论中显式标注数据口径。
- 每条修复建议必须附着验证方式（trace / lab / RUM 指标）。

## 三段式诊断流程

### 第一段：网络层

- 关键资源链：HTML → CSS → 阻塞 JS → 字体 → 首屏图片
- 资源优先级：`preload` / `fetchpriority` / `defer` / `async`
- CDN 与缓存：TTFB 地域分布、Cache-Control、CDN 命中率
- 字体：`font-display` 策略、子集化、FOIT/FOUT 影响
- 图片：格式（WebP/AVIF）、尺寸（srcset）、LCP 元素是否被 lazy-load

### 第二段：渲染层

- LCP 分解：TTFB → 资源加载延迟 → 资源加载时间 → 元素渲染延迟
- CLS 归因：图像占位缺失、字体替换、动态注入（广告/iframe）、动效偏移
- Layout：layout thrash（读写交错）、强制同步布局、大 DOM 树
- Paint：paint storm、合成层失控（过多 `will-change`）
- Composite：scroll jank、主线程滚动监听、非合成动画

### 第三段：运行时

- INP 分解：input delay → processing time → presentation delay
- 长任务（>50ms）：主线程阻塞源、第三方脚本影响
- React：unnecessary re-render、context 颗粒度、key 错位、Server Component 数据瀑布
- Web Worker 边界：哪些计算可移出主线程
- 内存：object allocation 热点、闭包保留、事件监听泄漏

## 性能预算模板

| 指标 | 目标 | 测量方式 | 严重度 |
|------|------|---------|--------|
| TTFB | < 600ms (P75) | RUM | P1 |
| LCP | < 2.5s (P75) | RUM + lab | P1 |
| INP | < 200ms (P75) | RUM | P1 |
| CLS | < 0.1 (P75) | RUM + lab | P1 |
| TBT | < 200ms | lab | P2 |
| JS Bundle (首屏) | < 150KB gzip | stats | P2 |
| 第三方 JS | < 50KB gzip | bundle analyzer | P3 |

## 反模式

### FAIL: 不看数据直接猜

```
用户：首页加载慢
AI：应该是 bundle 太大了，做一下代码分割就好。
```

没有查看 trace、RUM 数据或 bundle analyzer。可能是 TTFB 高（CDN 问题）、LCP 资源被 lazy-load、或第三方脚本阻塞——每个原因对应完全不同的修复。

### PASS: 数据驱动的三段式诊断

```
AI：
## 网络层：TTFB P75 = 1.2s（RUM），CDN 命中率 42% → 核心问题
## 渲染层：LCP 图片 lazyload 了 loading="lazy" → 移除
## 运行时：TBT = 350ms（lab），第三方 chat widget 占 280ms → 延迟加载
优先修复：CDN 缓存 > LCP 图片 preload > chat widget 延迟
```

更多反模式与检查清单见 [references/anti-patterns.md](references/anti-patterns.md)。

## 交叉引用

- [`core-web-vitals`](../core-web-vitals/SKILL.md)：单项 CWV 指标的深度优化
- [`browser-rendering-patterns`](../browser-rendering-patterns/SKILL.md)：hydration、resource hints、content-visibility
- [`bundle-optimization`](../bundle-optimization/SKILL.md)：代码分割、tree shaking、依赖分析
- [`react-performance`](../../../react-expert/skills/react-performance/SKILL.md)：React 渲染优化专项
- [`js-micro-optimization`](../../../javascript-expert/skills/js-micro-optimization/SKILL.md)：JavaScript 热路径优化
