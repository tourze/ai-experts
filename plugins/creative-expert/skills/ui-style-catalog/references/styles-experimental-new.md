# 实验 / 新兴系

## Risograph
- **Keywords**: riso print, limited palette, grain, overprint
- **CSS Features**: 2-3 色叠印 / 颗粒噪点 / 偏移 registration / 活跃饱和色
- **Best For**: Indie Studio、Art Zine、Poster
- **Do Not Use For**: SaaS、Corporate
- **AI Prompt**: "risograph print aesthetic, limited 2-3 color palette, grain texture, print registration offset"

## Collage / Cut-paper
- **Keywords**: mixed media, paper cutouts, scissors, zine
- **CSS Features**: 剪贴拼贴 / 纸张纹理 / 不规则裁切 / 混合比例
- **Best For**: Creative Portfolio、Zine、Youth Campaign
- **Do Not Use For**: 信任型产品

## Duotone
- **Keywords**: two-color gradient, high contrast, photography tint
- **CSS Features**: 双色渐变 overlay / `mix-blend-mode: multiply` / 统一色调
- **Best For**: Portfolio、Photography、Music Artist
- **Do Not Use For**: 信息密集
- **AI Prompt**: "duotone photography, two-color gradient tint, high contrast blend"

## Isometric Illustration / Isometric UI
- **Keywords**: 30°/60° grid, iso 3D, infographic
- **CSS Features**: `transform: rotate()` + `skew` / SVG isometric 插画 / 统一投影角度
- **Best For**: SaaS Marketing、Infographic、Explainer
- **Do Not Use For**: Photorealistic Product、Editorial
- **AI Prompt**: "isometric illustration, 30-60 degree grid, infographic 3D, technical diagram"
- **Checklist**: ☐ 一致投影角度 ☐ 统一光源 ☐ 信息优于炫技

## Zine / Punk Zine
- **Keywords**: xerox, raw, cut-paste, diy
- **CSS Features**: 黑白高对比 / 拼贴字体 / 手撕边 / xerox 复印质感
- **Best For**: Indie Music、Activist Brand、Subculture
- **Do Not Use For**: Corporate、Polished

## Claymation / 3D Character
- **Keywords**: 3D render, clay figure, Blender, character
- **CSS Features**: 3D 渲染 PNG / 统一材质 clay 质感 / 柔光环境
- **Best For**: Onboarding、Marketing Hero、Character-led Brand
- **Do Not Use For**: 严肃 B2B、数据工具
- **AI Prompt**: "3D clay character render, soft material, Blender rendering, warm studio lighting"

## Matrix / Terminal Aesthetic
- **Keywords**: green on black, ascii, terminal, code-raining
- **CSS Features**: `color: #00FF41` / `background: #000` / 等宽字 / ascii 装饰 / 打字机动画
- **Best For**: Hacker-themed、CTF、Retro Gaming
- **Do Not Use For**: Modern SaaS、Accessible Product
- **AI Prompt**: "matrix terminal aesthetic, green text on black, ascii art, monospace code rain"

## Zero Interface (Voice/Gesture First)
- **Keywords**: invisible UI, voice, gesture, ambient
- **CSS Features**: 最小视觉元素 / 波形/光晕反馈 / 大触控区
- **Best For**: Voice Assistant、Smart Home、Ambient Computing
- **Do Not Use For**: 密集操作任务、键盘用户为主

## 3D & Hyperrealism
- **Keywords**: photoreal, ray-traced, WebGL, immersive
- **CSS Features**: three.js / react-three-fiber / PBR 材质 / HDRI 环境
- **Best For**: Gaming、Product Showcase、Immersive Brand
- **Do Not Use For**: 低端设备、移动优先、信息型工具
- **AI Prompt**: "hyperrealistic 3D rendering, ray-traced materials, cinematic lighting, immersive"

## Inclusive Design (Beyond Accessible)
- **Keywords**: universal, adaptable, all abilities
- **CSS Features**: 多模态输入 / 可调字号和间距 / 高对比切换 / 动效完全可关
- **Best For**: Public Service、Healthcare、Broad Audience
- **Do Not Use For**: 小众 niche（设计成本过高）
- **Checklist**: ☐ WCAG AAA ☐ 语音 + 键盘 + 触控全支持 ☐ 用户自定义缩放 ☐ 高对比切换

## Liquid Metal / Chrome
- **Keywords**: reflective, metallic, futuristic, shiny
- **CSS Features**: chrome gradient / `filter: drop-shadow` / SVG 反射 mask
- **Best For**: Luxury、Automotive、Premium Product
- **Do Not Use For**: 轻盈 SaaS、日用工具

## Neon Glass (Glassmorphism 2.0)
- **Keywords**: glowing glass, neon edge, dark glass
- **CSS Features**: dark bg + `backdrop-filter: blur` + 彩色边缘发光 `box-shadow: 0 0 20px <neon>`
- **Best For**: Web3、Gaming Dashboard、Modern Dark SaaS
- **Do Not Use For**: Light mode、Accessible
- **AI Prompt**: "neon glass ui, glowing translucent dark glass, edge neon glow"

## Generative / Particle Systems
- **Keywords**: generative art, particle field, procedural
- **CSS Features**: Canvas/WebGL 粒子 / p5.js / 响应鼠标/滚动
- **Best For**: Creative Brand Hero、AI Product Visuals
- **Do Not Use For**: 长时间停留页面（耗电）、移动端

## Cel-Shaded / Anime Illustration
- **Keywords**: toon shade, anime, flat shade cel
- **CSS Features**: 平涂 + 硬边阴影 / 活泼色 / 角色插画
- **Best For**: Gaming、Anime Community、Youth Brand
- **Do Not Use For**: Enterprise、严肃场景

## Variable Font Playground
- **Keywords**: animated font weight, width axis, expressive type
- **CSS Features**: variable font + `font-variation-settings` 动画 + hover/scroll 绑定
- **Best For**: Hero、Type-led Site、Creative Portfolio
- **Do Not Use For**: 正文、旧浏览器
- **Checklist**: ☐ 使用 variable font ☐ 动画不影响可读 ☐ `font-display: swap`
