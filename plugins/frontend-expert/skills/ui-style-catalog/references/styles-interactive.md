# 交互 / 空间系

## Motion-Driven
- **Keywords**: scroll animation, reveal, parallax, spring
- **CSS Features**: IntersectionObserver + `transform` + `opacity` 入场 / spring easing / 滚动绑定
- **Best For**: Portfolio、Storytelling、Marketing Launch
- **Do Not Use For**: 信息密集工具、生产力 App
- **AI Prompt**: "motion-driven web design, scroll-reveal animations, parallax depth, spring easing"
- **Checklist**: ☐ 尊重 `prefers-reduced-motion` ☐ 不阻塞首屏 ☐ 动效服务叙事

## Micro-interactions
- **Keywords**: subtle feedback, hover, click state, transition
- **CSS Features**: hover/focus/active 全状态 + 150-300ms transition + 小幅 scale/translate
- **Best For**: Mobile App、Touch UI、所有 UI 的基础层
- **Do Not Use For**: 不能用不了，这是基础约束
- **Checklist**: ☐ hover ☐ focus-visible ☐ active ☐ disabled ☐ transition 150-300ms

## Parallax Storytelling
- **Keywords**: depth scroll, layered, narrative
- **CSS Features**: 多图层不同 scroll speed / `transform: translateY(scrollY * ratio)` / 章节切换
- **Best For**: Brand Storytelling、Product Launch、Campaign Site
- **Do Not Use For**: SaaS 功能页、Dashboard
- **AI Prompt**: "parallax storytelling, layered depth scroll, narrative journey, multi-plane motion"

## Interactive Cursor Design
- **Keywords**: custom cursor, magnetic hover, reveal
- **CSS Features**: `cursor: none` + 自定义光标元素 + 磁吸悬停效果
- **Best For**: Creative Portfolio、Agency、Interactive Experience
- **Do Not Use For**: Touch-first、Accessibility-critical（光标 = 鼠标前提）
- **Checklist**: ☐ 触屏 fallback ☐ 键盘用户仍可用 ☐ `prefers-reduced-motion` 兜底

## 3D Product Preview
- **Keywords**: WebGL, rotate, zoom, three.js
- **CSS Features**: three.js/react-three-fiber / 3D model viewer / 交互旋转
- **Best For**: E-commerce、Furniture、Fashion、Hardware
- **Do Not Use For**: 低端设备、慢网络
- **Checklist**: ☐ 2D 图片 fallback ☐ 懒加载 ☐ 首屏性能不受影响

## Bento Box Grid
- **Keywords**: bento, mosaic card, uneven grid, dashboard
- **CSS Features**: CSS Grid 不等格 / 大圆角 12-20px / 内容类型多样 / 视觉层级明确
- **Best For**: Product Feature Page、Dashboard、Personal Site
- **Do Not Use For**: 长文章、强结构信息
- **AI Prompt**: "bento box grid, uneven mosaic cards, Apple-style feature showcase, large rounded tiles"
- **Checklist**: ☐ 不同尺寸卡片 ☐ 圆角统一 ☐ 内容类型差异（图/数/文/交互） ☐ 视觉重心明确

## Voice-First Multimodal
- **Keywords**: voice UI, waveform, audio, hands-free
- **CSS Features**: 波形动画 / 大触控目标 / 语音反馈视觉化
- **Best For**: Voice Assistant、Accessibility App、Car UI
- **Do Not Use For**: 静默场景、文档型产品

## Tactile Digital / Deformable UI
- **Keywords**: squishy, press feedback, elastic
- **CSS Features**: `transform: scale(0.95)` on press / spring 回弹 / 触觉反馈
- **Best For**: Modern Mobile App、Playful Brand
- **Do Not Use For**: 严肃工具、企业
