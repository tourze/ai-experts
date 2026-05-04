# 交互 / 空间系

## Motion-Driven（动效驱动）
- **关键词**: 滚动动画、揭示、视差、弹性缓动
- **CSS 特征**: IntersectionObserver + `transform` + `opacity` 入场 / spring easing / 滚动绑定
- **最适合**: 作品集、叙事型、营销发布页
- **不适合**: 信息密集工具、生产力 App
- **AI Prompt**: "motion-driven web design, scroll-reveal animations, parallax depth, spring easing"
- **检查清单**: ☐ 尊重 `prefers-reduced-motion` ☐ 不阻塞首屏 ☐ 动效服务叙事

## Micro-interactions（微交互）
- **关键词**: 微妙反馈、悬停、点击态、过渡
- **CSS 特征**: hover/focus/active 全状态 + 150-300ms transition + 小幅 scale/translate
- **最适合**: 移动 App、触控 UI、所有 UI 的基础层
- **不适合**: 不是可选项，这是基础约束
- **检查清单**: ☐ hover ☐ focus-visible ☐ active ☐ disabled ☐ transition 150-300ms

## Parallax Storytelling（视差叙事）
- **关键词**: 深度滚动、分层、叙事
- **CSS 特征**: 多图层不同 scroll speed / `transform: translateY(scrollY * ratio)` / 章节切换
- **最适合**: 品牌叙事、产品发布、营销活动站
- **不适合**: SaaS 功能页、仪表盘
- **AI Prompt**: "parallax storytelling, layered depth scroll, narrative journey, multi-plane motion"

## Interactive Cursor Design（交互光标设计）
- **关键词**: 自定义光标、磁吸悬停、揭示
- **CSS 特征**: `cursor: none` + 自定义光标元素 + 磁吸悬停效果
- **最适合**: 创意作品集、设计机构、互动体验
- **不适合**: 触控优先、可访问性关键场景（光标 = 鼠标前提）
- **检查清单**: ☐ 触屏 fallback ☐ 键盘用户仍可用 ☐ `prefers-reduced-motion` 兜底

## 3D Product Preview（3D 产品预览）
- **关键词**: WebGL、旋转、缩放、three.js
- **CSS 特征**: three.js/react-three-fiber / 3D 模型查看器 / 交互旋转
- **最适合**: 电商、家具、时尚、硬件
- **不适合**: 低端设备、慢网络
- **检查清单**: ☐ 2D 图片 fallback ☐ 懒加载 ☐ 首屏性能不受影响

## Bento Box Grid（便当盒网格）
- **关键词**: 便当盒、马赛克卡片、不等栅格、仪表盘
- **CSS 特征**: CSS Grid 不等格 / 大圆角 12-20px / 内容类型多样 / 视觉层级明确
- **最适合**: 产品功能页、仪表盘、个人网站
- **不适合**: 长文章、强结构化信息
- **AI Prompt**: "bento box grid, uneven mosaic cards, Apple-style feature showcase, large rounded tiles"
- **检查清单**: ☐ 不同尺寸卡片 ☐ 圆角统一 ☐ 内容类型差异（图/数/文/交互） ☐ 视觉重心明确

## Voice-First Multimodal（语音优先多模态）
- **关键词**: 语音 UI、波形、音频、免提
- **CSS 特征**: 波形动画 / 大触控目标 / 语音反馈视觉化
- **最适合**: 语音助手、可访问性 App、车载 UI
- **不适合**: 静默场景、文档型产品

## Tactile Digital / Deformable UI（触感数字/可变形界面）
- **关键词**: 弹性、按压反馈、伸缩
- **CSS 特征**: `transform: scale(0.95)` on press / spring 回弹 / 触觉反馈
- **最适合**: 现代移动 App、趣味品牌
- **不适合**: 严肃工具、企业
