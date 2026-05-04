# UI 风格目录索引

**60 种风格**，按气质分文件：

## 核心 40

- [styles-minimal-flat.md](styles-minimal-flat.md) — Minimalism / Swiss / Flat / Exaggerated Minimalism / Swiss Modernism 2.0 / Soft UI Evolution
- [styles-depth-glass.md](styles-depth-glass.md) — Glassmorphism / Neumorphism / Claymorphism / Skeuomorphism / Dimensional Layering / Liquid Glass
- [styles-bold-raw.md](styles-bold-raw.md) — Brutalism / Neubrutalism / Anti-Polish / Gen-Z Chaos / Kinetic Typography / Editorial Grid
- [styles-futuristic.md](styles-futuristic.md) — Cyberpunk / HUD Sci-Fi / Retro-Futurism / Aurora / Gradient Mesh / AI-Native / Spatial UI
- [styles-retro-playful.md](styles-retro-playful.md) — Y2K / Vaporwave / Memphis / Pixel Art / Vintage Analog / Chromatic Aberration
- [styles-organic-natural.md](styles-organic-natural.md) — Organic Biophilic / Nature Distilled / Biomimetic / Dark OLED / E-Ink Paper / Accessible
- [styles-interactive.md](styles-interactive.md) — Motion-Driven / Micro-interactions / Parallax Storytelling / Interactive Cursor / 3D Product / Bento / Voice-First / Tactile

## 扩充 20

- [styles-cultural-heritage.md](styles-cultural-heritage.md) — Bauhaus / Art Deco / Art Nouveau / Pop Art / Nordic / Japanese Ma / Cottagecore / Dark Academia / Folk / Steampunk
- [styles-experimental-new.md](styles-experimental-new.md) — Risograph / Collage / Duotone / Isometric / Zine / Claymation / Matrix Terminal / Zero Interface / 3D Hyperrealism / Inclusive Design / Liquid Metal / Neon Glass / Generative / Cel-Shaded / Variable Font

## 风格条目结构

每条给出：
- **Keywords**: 识别关键词
- **CSS Features**: 必须落地的特征清单
- **Best For**: 适合的产品类型
- **Do Not Use For**: 反适用场景
- **AI Prompt Keywords**: 给图像生成工具的标准 prompt 词
- **Checklist**: 实现验收项（部分条目）

## 混搭规则

- **允许混搭**：Minimalism + Motion-Driven；Flat + Micro-interactions；Bento + Glassmorphism；Nordic + Variable Font；Editorial + Duotone。
- **禁止混搭**：Glass + Neumorphism（阴影系冲突）；Brutalism + Soft UI（气质对立）；Cyberpunk + Accessible（对比冲突）；Art Deco + Neubrutalism（符号冲突）；Steampunk + AI-Native（时代错位）。
- 最多 2 种风格，其中 1 主 1 辅；辅风格只用于局部（按钮/卡片/装饰）。

## 致谢

参考 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 styles.csv（22 列 × 85 行）数据结构。本目录经过重写、按气质分组，并扩充了文化遗产（Bauhaus / Art Deco / Nordic / Wabi-sabi 等）和实验新兴（Risograph / Collage / Matrix / Variable Font 等）两大类，总计 60 种。
