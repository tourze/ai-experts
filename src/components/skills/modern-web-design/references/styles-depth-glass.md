# 深度 / 玻璃系

## Glassmorphism（玻璃态）
- **关键词**: 磨砂玻璃、模糊、半透明、背景虚化
- **CSS 特征**: `background: rgba(255,255,255,0.08)` + `backdrop-filter: blur(16px) saturate(150%)` + `border: 1px solid rgba(255,255,255,0.18)` + 彩色渐变背景打底
- **最适合**: 现代 SaaS、金融仪表盘、macOS/iOS 风格、Web3
- **不适合**: 低端设备（backdrop-filter 性能差）、纯白无彩色背景（失去玻璃感）
- **AI Prompt**: "glassmorphism, frosted glass effect, translucent cards, backdrop blur, colorful gradient background, saturated"
- **检查清单**: ☐ 彩色背景打底 ☐ 半透明 rgba ☐ backdrop-filter blur ☐ 微边框 ☐ 轻阴影

## Neumorphism（新拟物态）
- **关键词**: 浮雕、凹陷、柔和阴影、单色柔和
- **CSS 特征**: 同色系背景 + `box-shadow: -5px -5px 15px rgba(255,255,255,0.8), 5px 5px 15px rgba(0,0,0,0.1)` + `border-radius: 12-16px`
- **最适合**: 健康/养生、冥想、低交互场景
- **不适合**: 需要高对比的可访问性界面、数据密集仪表盘、深色模式
- **AI Prompt**: "neumorphism, soft embossed UI, monochromatic pastel, subtle double shadows, 3D soft extrude"
- **检查清单**: ☐ 双阴影（亮/暗） ☐ 同色系背景 ☐ 按下反转阴影 ☐ 避免暗色（对比不足）

## Claymorphism（黏土态）
- **关键词**: 3D 黏土、趣味、圆润、多彩
- **CSS 特征**: `border-radius: 24-32px` + 内高光 `inset 0 4px 0 rgba(255,255,255,0.4)` + 外阴影 + 饱和色
- **最适合**: 儿童教育科技、趣味 App、有个性的 SaaS
- **不适合**: 银行、法律、企业
- **AI Prompt**: "claymorphism, 3D clay UI, rounded chunky elements, playful bright colors, soft inner highlight"
- **检查清单**: ☐ 圆角 ≥ 20px ☐ 内高光 + 外阴影 ☐ 饱和色彩

## Skeuomorphism（拟物化）
- **关键词**: 真实纹理、写实质感、皮革、木纹、纸张
- **CSS 特征**: 真实材质贴图 / 渐变模拟立体 / 内外阴影组合 / 精细高光
- **最适合**: 经典 iOS、游戏、高端产品、怀旧体验
- **不适合**: 现代 Web App、响应式、快速迭代产品
- **AI Prompt**: "skeuomorphism, realistic textures, leather wood paper, detailed 3D rendering, tactile interface"

## Dimensional Layering（维度分层）
- **关键词**: 卡片堆叠、Z 深度、海拔、Material Design
- **CSS 特征**: 2-3 层清晰阴影（2dp/4dp/8dp/16dp） + 明确 z-index 分层
- **最适合**: 仪表盘、卡片布局、多弹窗 App
- **不适合**: 极简风、无层级界面
- **AI Prompt**: "dimensional layering, material design elevation, multiple z-depth shadows, card stack"
- **检查清单**: ☐ 阴影分级 ☐ 每层 z-index 明确 ☐ hover 提升 1 层

## Liquid Glass（液态玻璃）
- **关键词**: iOS 26 玻璃、磨砂流体、动态模糊
- **CSS 特征**: Glass + 动态变形（hover 放大 blur） + 边缘高光呼吸
- **最适合**: 高端 SaaS、高端电商、Apple 生态
- **不适合**: 老设备、可访问性敏感
- **AI Prompt**: "liquid glass, fluid frosted translucent, dynamic blur, iOS 26 glass material"
