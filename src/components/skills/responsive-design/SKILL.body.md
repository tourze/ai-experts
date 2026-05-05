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

- [references/container-queries.md](references/container-queries.md)
- [references/fluid-layouts.md](references/fluid-layouts.md)
- [references/breakpoint-strategies.md](references/breakpoint-strategies.md)
