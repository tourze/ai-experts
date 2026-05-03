# 反模式与检查清单

## 反模式

### FAIL: 把网络问题归因到 JS

```
性能报告：LCP 3.5s → 建议：拆分 JS bundle
```

TTFB 占 2.5s，JS 下载仅 200ms。真正瓶颈是服务端响应时间，拆 bundle 无效。

### PASS: 不混层归因

```
LCP 3.5s 分解：
- TTFB: 2.5s ← 服务端/CDN 问题，与前端无关
- 资源延迟: 200ms ← LCP 图片 discoverable 但未 preload
- 资源加载: 500ms ← 图片 1.2MB，建议 WebP + 压缩
- 元素渲染: 300ms ← 字体阻塞，建议 font-display: swap
```

## 检查清单

- [ ] 是否已区分 lab 与 RUM 数据口径？
- [ ] 是否区分了首屏/后续路由/交互场景？
- [ ] LCP 是否已分解为四段（TTFB/资源延迟/资源加载/元素渲染）？
- [ ] INP 是否已分解为三段（input delay/processing/presentation delay）？
- [ ] CLS 问题是否已归因到具体元素和操作？
- [ ] 每条修复建议是否附着了验证方式？
- [ ] 修复优先级是否按「用户可见影响 × 修复成本」排序？
