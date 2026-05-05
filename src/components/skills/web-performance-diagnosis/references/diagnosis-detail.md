# 三段式诊断详细流程

## 第一段：网络层

- 关键资源链：HTML → CSS → 阻塞 JS → 字体 → 首屏图片
- 资源优先级：`preload` / `fetchpriority` / `defer` / `async`
- CDN 与缓存：TTFB 地域分布、Cache-Control、CDN 命中率
- 字体：`font-display` 策略、子集化、FOIT/FOUT 影响
- 图片：格式（WebP/AVIF）、尺寸（srcset）、LCP 元素是否被 lazy-load

## 第二段：渲染层

- LCP 分解：TTFB → 资源加载延迟 → 资源加载时间 → 元素渲染延迟
- CLS 归因：图像占位缺失、字体替换、动态注入（广告/iframe）、动效偏移
- Layout：layout thrash（读写交错）、强制同步布局、大 DOM 树
- Paint：paint storm、合成层失控（过多 `will-change`）
- Composite：scroll jank、主线程滚动监听、非合成动画
- Hydration：SSR/CSR 不匹配导致的闪烁、suppressHydrationWarning、双阶段渲染
- content-visibility: auto 只用于视口外的长列表或低优先级区域
- Script：defer / async 策略选择

## 第三段：运行时

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

可能是 TTFB 高（CDN 问题）、LCP 资源被 lazy-load、或第三方脚本阻塞。

### PASS: 数据驱动的三段式诊断

```
## 网络层：TTFB P75 = 1.2s（RUM），CDN 命中率 42% → 核心问题
## 渲染层：LCP 图片 lazyload 了 loading="lazy" → 移除
## 运行时：TBT = 350ms（lab），第三方 chat widget 占 280ms → 延迟加载
优先修复：CDN 缓存 > LCP 图片 preload > chat widget 延迟
```

### FAIL: 把网络问题归因到 JS

```
性能报告：LCP 3.5s → 建议：拆分 JS bundle
```

TTFB 占 2.5s，JS 下载仅 200ms。真正瓶颈是服务端响应时间。

### PASS: 不混层归因

```
LCP 3.5s 分解：
- TTFB: 2.5s ← 服务端/CDN 问题
- 资源延迟: 200ms ← LCP 图片未 preload
- 资源加载: 500ms ← 图片 1.2MB，建议 WebP
- 元素渲染: 300ms ← 字体阻塞，建议 font-display: swap
```
