# Lottie 动画接入

与 `interaction-design` 联动的 Lottie / dotLottie 动画接入指南。

## 使用场景

- 微交互需要轻量动画（加载、成功/失败状态、hover 反馈）。
- 需要跨平台一致的矢量动画。

## 接入方式

```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

<DotLottieReact src="animation.lottie" loop autoplay />
```

## 约束

- 动画文件 < 50KB，超过则用 CSS 动画或 APNG。
- 优先 `dotLottie` 格式（更小、更多特性）。
- 必须提供静态回退（动画未加载或用户偏好 `prefers-reduced-motion`）。
- 不用于页面级大动画（用视频或 WebGL 替代）。
