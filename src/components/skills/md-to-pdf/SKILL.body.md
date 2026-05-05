## 核心约束

- 先检查依赖，再开始渲染；不要等到最后一步才发现 `pandoc` 或 `mmdc` 缺失。
- 对大文档优先走默认管线，只有在确认依赖不足时才使用 `--no-mermaid` 或 `--no-math` 降级。
- 自定义 CSS 只能叠加，不要覆盖掉基础排版到不可读。
- 交付前至少抽查目录、图表、数学公式和分页效果。

## 代码模式

先运行依赖检查并参考 [README.md](README.md)：

```bash
node scripts/setup.mjs
python3 scripts/md_to_pdf.py input.md output.pdf --format A4 --header-footer
python3 scripts/md_to_pdf.py report.md report.pdf --margin 1in --css custom.css --landscape
python3 scripts/md_to_pdf.py tests/test_document.md sample.pdf --no-mermaid
```

配套资源：

- [README.md](README.md)
- [tests/test_document.md](tests/test_document.md)
- [scripts/setup.mjs](scripts/setup.mjs)

## 检查清单

- 是否已确认 `pandoc`、`mmdc`、`node + katex`、`playwright` 可用。
- 是否按需设置 `--format`、`--margin`、`--header-footer` 和 `--css`。
- Mermaid 与数学公式是否都成功渲染，没有留下源代码片段。
- 输出 PDF 是否抽查了首尾页、宽表格、长代码块和分页位置。
- 若只是要生成 Word 或 PPT，请不要误用本技能。

## 反模式

### FAIL: 不检查依赖

```bash
python3 scripts/md_to_pdf.py report.md report.pdf
# Error: mmdc not found
# 但已经渲染了 80% 页面 → 拿到半成品 PDF（图为空）
```

### PASS: setup → render

```bash
node scripts/setup.mjs  # 检查 pandoc/mmdc/katex/playwright
# 全部通过 → render
python3 scripts/md_to_pdf.py report.md report.pdf --format A4 --header-footer
```

### FAIL: 重型 CSS 覆盖

```css
/* custom.css */
* { font-size: 8px !important; color: #aaa; }
table { border: none; }
/* 打印出来读不清 / 表格无法分辨行列 */
```

### PASS: 增量调整

```css
/* 仅微调，不破坏基础排版 */
h1 { font-family: 'Source Han Serif', serif; }
table th { background-color: #f6f6f6; }
/* 保留默认字号 / 间距 / 边框 */
```

### FAIL: 怪渲染器不修源

```md
[源 MD]
- 表格 12 列宽到溢出
- 图片未指定显示尺寸，导致导出时整页溢出

[抱怨]
"PDF 把表格切坏了 / 图占整页"
```

### PASS: 修源文件

```md
- 表格拆成两个或加 `--margin 0.5in --landscape`
- 图片：为 Markdown 图片补上 width 属性，例如 `image width=80%`
```
