---
name: core-web-vitals
description: 用于修复和优化 Core Web Vitals（LCP、INP、CLS）。当用户提到“优化首屏性能”“修 LCP/INP/CLS”“减少布局抖动”“提升页面体验”时使用。
license: MIT
metadata:
  author: web-quality-skills
  version: "1.0"
---

# Core Web Vitals 优化

## 适用场景

- 页面首屏慢、交互卡顿、滚动或加载时发生明显抖动。
- Lighthouse 分数下降，但需要进一步定位到真实用户指标。
- 需要给营销页、Web App、内容页制定性能修复优先级。
- 需要把性能问题拆成 LCP、INP、CLS 三类治理任务。

## 核心约束

- 先区分实验室数据和真实用户数据。`Lighthouse` 用来定位，`field data` 用来验收。
- 先修用户路径，再修全局平均值。首屏、主 CTA、核心表单优先。
- LCP 元素必须尽早被浏览器发现；不要把它藏在懒加载、轮播或客户端二次渲染之后。
- INP 问题优先查主线程长任务、同步计算、重排重绘和阻塞事件处理。
- CLS 只能靠稳定布局解决，不能靠“加载更快”掩盖。
- 遇到整站性问题时，联动 [web-quality-audit](../web-quality-audit/SKILL.md) 与 [responsive-design](../responsive-design/SKILL.md) 一起审。

## 代码模式

```html
<!-- LCP 图片：提前发现 + 高优先级 -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
<img
  src="/hero.webp"
  width="1440"
  height="900"
  fetchpriority="high"
  alt="产品主视觉"
>
```

```js
// INP：把重任务拆片，避免一次性占满主线程
async function updateDashboard(chunks) {
  for (const chunk of chunks) {
    renderChunk(chunk);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
```

```css
/* CLS：给媒体和广告位预留稳定空间 */
.hero-media {
  aspect-ratio: 16 / 9;
  width: 100%;
}
```

## 检查清单

- [ ] LCP 元素已确认，且存在于初始 HTML。
- [ ] LCP 图片/字体已使用 `preload` 或等价优先级策略。
- [ ] 关键字体使用 `font-display: swap` 或同等非阻塞方案。
- [ ] 事件处理链路里不存在明显长任务。
- [ ] 图片、视频、广告、嵌入内容都已声明尺寸或 `aspect-ratio`。
- [ ] 关键交互在低端设备和慢网下也可用。
- [ ] 修复后同时复测实验室数据与真实用户数据。

## 反模式

- 只看 Lighthouse 分数，不看真实用户 75 分位数据。
- 给 LCP 图片加 `loading="lazy"`。
- 用骨架屏掩盖根因，让真实内容仍然晚到。
- 在点击事件里同步做大计算、JSON 解析或批量 DOM 更新。
- 依赖内容加载后“撑开布局”，导致 CLS 持续抖动。

## 参考资料

- [web-quality-audit](../web-quality-audit/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [LCP 参考](https://web.dev/articles/lcp)
- [INP 参考](https://web.dev/articles/inp)
- [CLS 参考](https://web.dev/articles/cls)
