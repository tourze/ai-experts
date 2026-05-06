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
