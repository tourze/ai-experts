## 三段式诊断

### 第一段：网络层

关键资源链、资源优先级（preload/fetchpriority/defer/async）、CDN 缓存、字体策略、图片格式与 LCP 元素。

### 第二段：渲染层

LCP 四段分解、CLS 归因、layout thrash、paint storm、合成层失控、hydration 修复、content-visibility、script defer/async。

### 第三段：运行时

INP 三段分解、长任务、React re-render、Web Worker 边界、内存泄漏。

详细流程、性能预算模板、代码模式与完整反模式见 [references/diagnosis-detail.md](references/diagnosis-detail.md)。

## 单项 CWV 深度优化

LCP/INP/CLS 的代码模式（preload/fetchpriority、任务拆片/requestAnimationFrame、aspect-ratio 预留空间）及常见反模式（LCP 懒加载、同步大计算阻塞主线程、图片不声明尺寸）见 [references/cwv-patterns.md](references/cwv-patterns.md)。

LCP 子阶段分解、框架特定优化（Next.js Image priority、NuxtImg preload、Astro Image loading=eager）与调试代码见 [references/LCP-optimization.md](references/LCP-optimization.md)。

## 质量审计

四维度（性能/a11y/SEO/best practices）全覆盖。快速 HTML 扫描：

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

问题分级与 AI 指纹检测详见 [references/quality-audit.md](references/quality-audit.md)。

## 瀑布流消除与浏览器渲染

核心代码模式（Promise.all 并行化、hydration 双阶段渲染、resource hints、passive listeners）和规则索引见 [references/rendering-and-waterfall.md](references/rendering-and-waterfall.md)。
