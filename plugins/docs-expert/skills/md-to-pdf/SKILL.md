---
name: md-to-pdf
description: 当用户要把 Markdown 文档导出为 PDF 时使用，支持 Mermaid 图、KaTeX 数学公式、代码块、表格、自定义 CSS、页边距和页码。适合报告、论文、规范和展示材料的打印级输出。
---

# Markdown 转 PDF

## 适用场景

- 用户明确要求把 `.md` 渲染成 `.pdf`，而不是只生成 HTML 或截图。
- 文档中包含 Mermaid、LaTeX 数学公式、代码块、表格或脚注。
- 需要 A4、Letter、横向版式、页码、额外 CSS 等排版控制。
- 若文档内容本身还没写好，先用 [markdown-mermaid-writing](../markdown-mermaid-writing/SKILL.md) 产出源文档。

## 核心约束

- 先检查依赖，再开始渲染；不要等到最后一步才发现 `pandoc` 或 `mmdc` 缺失。
- 对大文档优先走默认管线，只有在确认依赖不足时才使用 `--no-mermaid` 或 `--no-math` 降级。
- 自定义 CSS 只能叠加，不要覆盖掉基础排版到不可读。
- 交付前至少抽查目录、图表、数学公式和分页效果。

## 代码模式

先运行依赖检查并参考 [README.md](README.md)：

```bash
bash scripts/setup.sh
python3 scripts/md_to_pdf.py input.md output.pdf --format A4 --header-footer
python3 scripts/md_to_pdf.py report.md report.pdf --margin 1in --css custom.css --landscape
python3 scripts/md_to_pdf.py tests/test_document.md sample.pdf --no-mermaid
```

配套资源：

- [README.md](README.md)
- [tests/test_document.md](tests/test_document.md)
- [scripts/setup.sh](scripts/setup.sh)

## 检查清单

- 是否已确认 `pandoc`、`mmdc`、`node + katex`、`playwright` 可用。
- 是否按需设置 `--format`、`--margin`、`--header-footer` 和 `--css`。
- Mermaid 与数学公式是否都成功渲染，没有留下源代码片段。
- 输出 PDF 是否抽查了首尾页、宽表格、长代码块和分页位置。
- 若只是要生成 Word 或 PPT，请不要误用本技能。

## 反模式

- 没跑 `setup.sh` 就直接渲染复杂文档。
- 发现依赖缺失后继续硬跑，最后拿到半成品 PDF。
- 用重型自定义 CSS 覆盖默认样式，导致打印版不可读。
- 把 Markdown 里的排版问题归咎于 PDF 渲染器，而不修源文件。
