---
title: 优化 SVG 精度
impact: LOW
impactDescription: 减少文件体积
tags: rendering, svg, optimization, svgo
---

## 优化 SVG 精度

降低 SVG 坐标精度以减少文件体积。最佳精度取决于 viewBox 大小，但一般都应考虑降低精度。

**错误（精度过高）：**

```svg
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />
```

**正确（保留 1 位小数）：**

```svg
<path d="M 10.3 20.8 L 30.9 40.2" />
```

**使用 SVGO 自动化：**

```bash
npx svgo --precision=1 --multipass icon.svg
```
