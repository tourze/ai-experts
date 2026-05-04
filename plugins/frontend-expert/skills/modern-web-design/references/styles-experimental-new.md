# 实验 / 新兴系

## Risograph（孔版印刷）
- **关键词**: 孔版印刷、有限色板、颗粒、叠印
- **CSS 特征**: 2-3 色叠印 / 颗粒噪点 / 偏移 registration / 活跃饱和色
- **最适合**: 独立工作室、艺术小志、海报
- **不适合**: SaaS、企业
- **AI Prompt**: "risograph print aesthetic, limited 2-3 color palette, grain texture, print registration offset"

## Collage / Cut-paper（拼贴/剪纸）
- **关键词**: 混合媒介、剪纸、剪刀、小志
- **CSS 特征**: 剪贴拼贴 / 纸张纹理 / 不规则裁切 / 混合比例
- **最适合**: 创意作品集、小志、青年营销
- **不适合**: 信任型产品

## Duotone（双色调）
- **关键词**: 双色渐变、高对比、摄影染色
- **CSS 特征**: 双色渐变 overlay / `mix-blend-mode: multiply` / 统一色调
- **最适合**: 作品集、摄影、音乐人
- **不适合**: 信息密集型页面
- **AI Prompt**: "duotone photography, two-color gradient tint, high contrast blend"

## Isometric Illustration / Isometric UI（等距插画/等距 UI）
- **关键词**: 30°/60° 网格、等距 3D、信息图
- **CSS 特征**: `transform: rotate()` + `skew` / SVG 等距插画 / 统一投影角度
- **最适合**: SaaS 营销、信息图、产品说明
- **不适合**: 写实产品、编辑类
- **AI Prompt**: "isometric illustration, 30-60 degree grid, infographic 3D, technical diagram"
- **检查清单**: ☐ 一致投影角度 ☐ 统一光源 ☐ 信息优于炫技

## Zine / Punk Zine（小志/朋克小志）
- **关键词**: 复印机、原生、剪贴、DIY
- **CSS 特征**: 黑白高对比 / 拼贴字体 / 手撕边 / 复印质感
- **最适合**: 独立音乐、行动主义品牌、亚文化
- **不适合**: 企业、精致化场景

## Claymation / 3D Character（黏土动画/3D 角色）
- **关键词**: 3D 渲染、黏土形象、Blender、角色 IP
- **CSS 特征**: 3D 渲染 PNG / 统一材质黏土质感 / 柔光环境
- **最适合**: 引导页、营销首屏、角色主导品牌
- **不适合**: 严肃 B2B、数据工具
- **AI Prompt**: "3D clay character render, soft material, Blender rendering, warm studio lighting"

## Matrix / Terminal Aesthetic（矩阵/终端美学）
- **关键词**: 绿字黑底、ASCII、终端、代码雨
- **CSS 特征**: `color: #00FF41` / `background: #000` / 等宽字 / ascii 装饰 / 打字机动画
- **最适合**: 黑客主题、CTF、复古游戏
- **不适合**: 现代 SaaS、可访问性产品
- **AI Prompt**: "matrix terminal aesthetic, green text on black, ascii art, monospace code rain"

## Zero Interface（零界面：语音/手势优先）
- **关键词**: 隐形 UI、语音、手势、环境式
- **CSS 特征**: 最小视觉元素 / 波形/光晕反馈 / 大触控区
- **最适合**: 语音助手、智能家居、环境计算
- **不适合**: 密集操作任务、键盘用户为主

## 3D & Hyperrealism（3D 与超写实）
- **关键词**: 照片级、光线追踪、WebGL、沉浸式
- **CSS 特征**: three.js / react-three-fiber / PBR 材质 / HDRI 环境
- **最适合**: 游戏、产品展示、沉浸式品牌
- **不适合**: 低端设备、移动优先、信息型工具
- **AI Prompt**: "hyperrealistic 3D rendering, ray-traced materials, cinematic lighting, immersive"

## Inclusive Design（包容性设计：超越可访问性）
- **关键词**: 通用、可适配、全能力
- **CSS 特征**: 多模态输入 / 可调字号和间距 / 高对比切换 / 动效完全可关
- **最适合**: 公共服务、医疗、广泛受众
- **不适合**: 小众 niche（设计成本过高）
- **检查清单**: ☐ WCAG AAA ☐ 语音 + 键盘 + 触控全支持 ☐ 用户自定义缩放 ☐ 高对比切换

## Liquid Metal / Chrome（液态金属/镀铬）
- **关键词**: 反射、金属质感、未来感、闪亮
- **CSS 特征**: chrome 渐变 / `filter: drop-shadow` / SVG 反射 mask
- **最适合**: 奢侈品、汽车、高端产品
- **不适合**: 轻盈 SaaS、日用工具

## Neon Glass（霓虹玻璃：Glassmorphism 2.0）
- **关键词**: 发光玻璃、霓虹边缘、暗色玻璃
- **CSS 特征**: dark bg + `backdrop-filter: blur` + 彩色边缘发光 `box-shadow: 0 0 20px <neon>`
- **最适合**: Web3、游戏仪表盘、现代暗色 SaaS
- **不适合**: 浅色模式、可访问性敏感
- **AI Prompt**: "neon glass ui, glowing translucent dark glass, edge neon glow"

## Generative / Particle Systems（生成式/粒子系统）
- **关键词**: 生成艺术、粒子场、程序化
- **CSS 特征**: Canvas/WebGL 粒子 / p5.js / 响应鼠标/滚动
- **最适合**: 创意品牌首屏、AI 产品视觉
- **不适合**: 长时间停留页面（耗电）、移动端

## Cel-Shaded / Anime Illustration（赛璐珞/动画风格插画）
- **关键词**: 平涂、动画、硬边阴影赛璐珞
- **CSS 特征**: 平涂 + 硬边阴影 / 活泼色 / 角色插画
- **最适合**: 游戏、动漫社区、青年品牌
- **不适合**: 企业、严肃场景

## Variable Font Playground（可变字体实验场）
- **关键词**: 动态字重、宽度轴、表现力字体
- **CSS 特征**: variable font + `font-variation-settings` 动画 + hover/scroll 绑定
- **最适合**: 首屏、字体主导网站、创意作品集
- **不适合**: 正文、旧浏览器
- **检查清单**: ☐ 使用 variable font ☐ 动画不影响可读性 ☐ `font-display: swap`
