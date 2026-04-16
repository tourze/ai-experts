---
name: concept-to-image
description: 当用户要把概念做成静态图、HTML 导出 PNG/SVG、做信息图或卡片时使用；如果要动画，改用 concept-to-video。
---

# 概念转图片

## 适用场景

- 需要把流程、架构、对比、层级、海报、卡片做成静态图。
- 用户已经有一个 HTML 视觉稿，希望导出为 PNG 或 SVG。
- 需要一个“可以先改 HTML，再导出图片”的迭代式流程。
- 如果只想做纯艺术化单页作品，改用 [canvas-design](../canvas-design/SKILL.md)。
- 如果目标是动画或解释视频，改用 [concept-to-video](../concept-to-video/SKILL.md)。

## 核心约束

- 中间产物必须是单文件、自包含的 HTML；CSS 内联，图形优先内联 SVG。
- 根容器必须有 `.canvas`，导出脚本默认抓这个选择器。
- 脚本默认视口是 `1920x1080`，PNG 默认 `--scale 2`。
- 真正的 SVG 导出只适用于“`.canvas` 自身就是根 `<svg>`”或内部只有一个根 `<svg>` 的情况；否则会自动回退到 PNG。
- 依赖 `playwright` 与 Chromium；缺依赖时先安装，不要假定环境自带。
- 不负责交互式网页、可点击 dashboard 或摄影式 AI 出图。

## 代码模式

### 1. 从模板起步

优先使用：

- [assets/template.html](assets/template.html)
- [references/design-guide.md](references/design-guide.md)

### 2. 导出 PNG

```bash
python3 scripts/render_to_image.py output.html output.png \
  --width 1200 \
  --height 630 \
  --scale 2 \
  --selector ".canvas"
```

### 3. 导出 SVG

```bash
python3 scripts/render_to_image.py output.html output.svg --selector ".canvas"
```

参数约束：

- `input`：输入 HTML 文件。
- `output`：必须是 `.png` 或 `.svg`。
- `--width` / `--height`：视口尺寸，默认 `1920` / `1080`。
- `--scale`：只影响 PNG，默认 `2`。
- `--full-page`：只支持 PNG。

### 4. 为可导出 SVG 设计结构

如果目标是矢量导出，推荐 `.canvas` 直接就是 `<svg>`：

```html
<svg class="canvas" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f5f1e8" />
  <text x="80" y="120">System Map</text>
</svg>
```

## 检查清单

- HTML 为单文件、自包含，不依赖远程字体或远程资源。
- `.canvas` 选择器确实存在。
- 若要 SVG，结构满足“单根 `<svg>`”条件。
- Playwright 已安装，且 Chromium 已准备好。
- 图片尺寸、比例、字号都按目标场景设置，而不是沿用默认值。

## 反模式

- 让脚本去导出一个交互式 dashboard。
- 误以为任意 HTML/CSS 都能得到真正的矢量 SVG。
- 在文档里承诺脚本根本没有实现的参数。
- 使用外链资源，导致本地导出和最终显示不一致。
- 为了做动画还坚持走静态图片链路。
