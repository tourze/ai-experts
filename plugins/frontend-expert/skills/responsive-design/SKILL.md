---
name: responsive-design
description: 当用户提到响应式布局、适配移动端、流式排版、容器查询、container queries 或移动优先断点时使用。
---

# 响应式设计

## 适用场景

- 页面或组件需要同时适配手机、平板、桌面和大屏。
- 需要让组件基于容器宽度自适应，而不是绑死视口断点。
- 需要统一断点、栅格、流式字号和图片策略。
- 需要排查移动端溢出、断行、内容拥挤或过宽阅读区。

## 核心约束

- 采用移动优先；基础样式先服务窄屏，再逐级增强。
- 断点跟内容走，不跟设备型号走。
- 组件级响应优先使用 `container queries`，页面级结构再用 `media queries`。
- 响应式不只是宽度变化，还包括触控、键盘、密度、方向和内容长度。
- 任何断点策略都不能牺牲可访问性和关键操作路径。

## 代码模式

```css
.card-list {
  container-type: inline-size;
}

@container (min-width: 36rem) {
  .card {
    display: grid;
    grid-template-columns: 14rem 1fr;
    gap: 1.5rem;
  }
}
```

```css
.headline {
  font-size: clamp(1.75rem, 4vw, 3.5rem);
  line-height: 1.05;
}
```

```html
<img
  src="/hero-1280.webp"
  srcset="/hero-640.webp 640w, /hero-960.webp 960w, /hero-1280.webp 1280w"
  sizes="(min-width: 1024px) 50vw, 100vw"
  width="1280"
  height="720"
  alt="Hero"
>
```

## 检查清单

- [ ] 基础窄屏样式已可用，再逐步增强到大屏。
- [ ] 组件级布局优先用了容器查询或等价机制。
- [ ] 标题、正文、按钮和表单在各断点下都可读可点。
- [ ] 图片、媒体和表格不会在小屏溢出。
- [ ] 断点改动没有破坏键盘导航和焦点可见性。
- [ ] 已联动 [core-web-vitals](../core-web-vitals/SKILL.md) 检查图片与布局稳定性。

## 反模式

### FAIL: 桌面优先 + JS 读宽度

```javascript
// 在组件内部判断设备
if (window.innerWidth < 768) {
  return <MobileLayout />;
}
return <DesktopLayout />;
// SSR 没有 window → 崩溃；resize 不触发重渲染
```

### PASS: 移动优先 + CSS 容器查询

```css
/* 基础样式即窄屏 */
.card { display: block; }

/* 宽屏增强 */
@container (min-width: 36rem) {
  .card { display: grid; grid-template-columns: 14rem 1fr; }
}
```

- 断点过多且跟具体设备型号绑定。
- 小屏上继续保留桌面级内容密度和列数。
- 因为”适配”而隐藏关键功能或关键信息。

## 参考资料

- [core-web-vitals](../core-web-vitals/SKILL.md)
- [web-design-guidelines](../modern-web-design/SKILL.md)
- [references/container-queries.md](references/container-queries.md)
- [references/fluid-layouts.md](references/fluid-layouts.md)
- [references/breakpoint-strategies.md](references/breakpoint-strategies.md)
