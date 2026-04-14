---
name: pretty-mermaid
description: 当用户要把 Mermaid 图表渲染成更美观的 SVG 或 ASCII 输出，或明确要求“画图”“美化 Mermaid”“渲染 Mermaid”“批量导出 Mermaid 图”时使用。该技能补足 Mermaid 从源码到成品图的渲染链路。
---

# Pretty Mermaid

> 来源：基于 `https://github.com/imxv/Pretty-mermaid-skills` 整理并并入本仓库；上游许可证见 [LICENSE.txt](LICENSE.txt)。

## 适用场景

- 用户已经有 Mermaid 源码，需要渲染成 SVG 成品图或终端可读的 ASCII 图。
- 用户要求“画流程图 / 时序图 / 状态图 / 类图 / ER 图”，并且希望输出不仅是代码块，还要有可直接预览的图形文件。
- 用户需要给报告、提案、PR 文档、演示材料补一张更精致的 Mermaid 图。
- 用户要批量渲染多个 `.mmd` 文件，或要快速遍历主题。
- 若重点是“写文档与 Mermaid 源码本身”，先结合 [markdown-mermaid-writing](../markdown-mermaid-writing/SKILL.md)；若最终还要导出 PDF，可继续接 [md-to-pdf](../md-to-pdf/SKILL.md)。

## 核心约束

- 先确定图的用途，再决定输出格式：文档嵌入优先 SVG，终端预览优先 ASCII。
- 先产出可维护的 Mermaid 源码，再渲染；不要只交付一张图片而丢失源码。
- 图要服务于说明，不要把所有逻辑塞进一张大图；复杂主题拆成多张图。
- 主题和颜色要服从文档场景，不要为了“炫”而牺牲对比度和可读性。
- 脚本依赖 `beautiful-mermaid`；首次运行会在当前 skill 目录自动执行 `npm install`，需要本机有可用的 `node` 与 `npm`。

## 代码模式

优先读取这些参考资料与模板：

- [references/DIAGRAM_TYPES.md](references/DIAGRAM_TYPES.md)
- [references/THEMES.md](references/THEMES.md)
- [references/api_reference.md](references/api_reference.md)
- [assets/example_diagrams/flowchart.mmd](assets/example_diagrams/flowchart.mmd)
- [assets/example_diagrams/sequence.mmd](assets/example_diagrams/sequence.mmd)
- [assets/example_diagrams/state.mmd](assets/example_diagrams/state.mmd)
- [assets/example_diagrams/class.mmd](assets/example_diagrams/class.mmd)
- [assets/example_diagrams/er.mmd](assets/example_diagrams/er.mmd)

列主题：

```bash
node scripts/themes.mjs
```

渲染单张 SVG：

```bash
node scripts/render.mjs \
  --input assets/example_diagrams/flowchart.mmd \
  --output /tmp/flowchart.svg \
  --theme tokyo-night
```

渲染 ASCII 预览：

```bash
node scripts/render.mjs \
  --input assets/example_diagrams/sequence.mmd \
  --format ascii \
  --use-ascii
```

批量渲染目录下所有 `.mmd`：

```bash
node scripts/batch.mjs \
  --input-dir assets/example_diagrams \
  --output-dir /tmp/pretty-mermaid-out \
  --format svg \
  --theme github-light
```

## 检查清单

- 是否先判断了该用流程图、时序图、状态图、类图还是 ER 图，而不是随手乱画。
- 是否保留了 Mermaid 源码，保证图可复制、可 diff、可后续修改。
- 是否先用 [references/THEMES.md](references/THEMES.md) 或 `node scripts/themes.mjs` 确认了主题，而不是拍脑袋选色。
- 若输出 SVG，是否确认图会被嵌入文档、提案或网页；若输出 ASCII，是否确认用户确实在终端或纯文本场景阅读。
- 若图来自用户自然语言需求，是否先和 [references/DIAGRAM_TYPES.md](references/DIAGRAM_TYPES.md) 对齐图种，再开始写 Mermaid 源码。
- 批量渲染时，是否确认输入目录里只有需要处理的 `.mmd`，避免把历史草稿一起导出。

## 反模式

- 只交付渲染后的图片，不保留 Mermaid 源码。
- 明明只是两三步流程，却强行画复杂大图，反而更难读。
- 文档里已经有 Mermaid 代码块，还额外输出一套风格冲突的图。
- 未确认阅读场景就默认深色主题，导致打印或浅色文档中难以阅读。
- 遇到图不清晰时继续往同一张图塞节点，而不是拆图或重选图种。
