---
name: core-web-vitals
description: 当用户需要修复或优化 Core Web Vitals（LCP、INP、CLS）时使用。适合”优化首屏性能””修 LCP/INP/CLS””减少布局抖动””提升页面体验”等场景。
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
- 遇到整站性问题时，联动 [web-performance-diagnosis](../web-performance-diagnosis/SKILL.md) 与 [responsive-design](../responsive-design/SKILL.md) 一起审。

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

### FAIL: LCP 图片懒加载

```html
<img src=”/hero.webp” loading=”lazy” alt=”主视觉”>
<!-- 浏览器发现晚 200-500ms，LCP 直接崩 -->
```

### PASS: 首屏图片高优先级

```html
<link rel=”preload” as=”image” href=”/hero.webp” fetchpriority=”high”>
<img src=”/hero.webp” fetchpriority=”high” width=”1440” height=”900” alt=”主视觉”>
```

### FAIL: 点击事件同步大计算

```js
button.onclick = () => {
  const result = heavyCalc(items);  // 主线程卡 800ms
  updateUI(result);
};
```

### PASS: 拆片 + 让出主线程

```js
button.onclick = async () => {
  for (const chunk of chunks) {
    processChunk(chunk);
    await new Promise(r => requestAnimationFrame(r));
  }
};
```

### FAIL: 图片不声明尺寸

```html
<img src=”/ad.jpg”>  <!-- 加载完把下面内容顶开，CLS 飙升 -->
```

### PASS: aspect-ratio 预留空间

```css
.media { aspect-ratio: 16/9; width: 100%; }
```

## 参考资料

- [web-performance-diagnosis](../web-performance-diagnosis/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [LCP 参考](https://web.dev/articles/lcp)
- [INP 参考](https://web.dev/articles/inp)
- [CLS 参考](https://web.dev/articles/cls)
