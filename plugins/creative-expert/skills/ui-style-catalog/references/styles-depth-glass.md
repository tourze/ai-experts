# 深度 / 玻璃系

## Glassmorphism
- **Keywords**: frosted glass, blur, translucent, backdrop
- **CSS Features**: `background: rgba(255,255,255,0.08)` + `backdrop-filter: blur(16px) saturate(150%)` + `border: 1px solid rgba(255,255,255,0.18)` + 彩色渐变背景打底
- **Best For**: Modern SaaS、Fintech Dashboard、macOS/iOS 风格、Web3
- **Do Not Use For**: 低端设备（backdrop-filter 性能差）、纯白无彩色背景（失去玻璃感）
- **AI Prompt**: "glassmorphism, frosted glass effect, translucent cards, backdrop blur, colorful gradient background, saturated"
- **Checklist**: ☐ 彩色背景打底 ☐ 半透明 rgba ☐ backdrop-filter blur ☐ 微边框 ☐ 轻阴影

## Neumorphism
- **Keywords**: embossed, debossed, soft shadow, monochromatic pastel
- **CSS Features**: 同色系背景 + `box-shadow: -5px -5px 15px rgba(255,255,255,0.8), 5px 5px 15px rgba(0,0,0,0.1)` + `border-radius: 12-16px`
- **Best For**: Health/Wellness、Meditation、Minimal Interaction
- **Do Not Use For**: 需要高对比的 a11y 界面、数据密集仪表盘、深色模式
- **AI Prompt**: "neumorphism, soft embossed UI, monochromatic pastel, subtle double shadows, 3D soft extrude"
- **Checklist**: ☐ 双阴影（亮/暗） ☐ 同色系背景 ☐ 按下反转阴影 ☐ 避免暗色（对比不足）

## Claymorphism
- **Keywords**: 3D clay, playful, rounded, colorful
- **CSS Features**: `border-radius: 24-32px` + 内高光 `inset 0 4px 0 rgba(255,255,255,0.4)` + 外阴影 + 饱和色
- **Best For**: EdTech Kids、Playful App、SaaS with character
- **Do Not Use For**: Banking、Legal、Enterprise
- **AI Prompt**: "claymorphism, 3D clay UI, rounded chunky elements, playful bright colors, soft inner highlight"
- **Checklist**: ☐ 圆角 ≥ 20px ☐ 内高光 + 外阴影 ☐ 饱和色彩

## Skeuomorphism
- **Keywords**: real texture, realistic, leather, wood, paper
- **CSS Features**: 真实材质贴图 / 渐变模拟立体 / 内外阴影组合 / 精细高光
- **Best For**: Legacy iOS、Gaming、Premium Products、怀旧体验
- **Do Not Use For**: 现代 Web App、响应式、快速迭代产品
- **AI Prompt**: "skeuomorphism, realistic textures, leather wood paper, detailed 3D rendering, tactile interface"

## Dimensional Layering
- **Keywords**: card stack, z-depth, elevation, Material
- **CSS Features**: 2-3 层清晰阴影（2dp/4dp/8dp/16dp） + 明确 z-index 分层
- **Best For**: Dashboard、Card Layout、Modal-heavy App
- **Do Not Use For**: 极简风、无层级界面
- **AI Prompt**: "dimensional layering, material design elevation, multiple z-depth shadows, card stack"
- **Checklist**: ☐ 阴影分级 ☐ 每层 z-index 明确 ☐ hover 提升 1 层

## Liquid Glass
- **Keywords**: iOS 26 glass, frosted fluid, dynamic blur
- **CSS Features**: Glass + 动态变形（hover 放大 blur） + 边缘高光呼吸
- **Best For**: Premium SaaS、High-end E-commerce、Apple 生态
- **Do Not Use For**: 老设备、a11y 敏感
- **AI Prompt**: "liquid glass, fluid frosted translucent, dynamic blur, iOS 26 glass material"
