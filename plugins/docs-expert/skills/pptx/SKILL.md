---
name: pptx
description: 当用户要处理 PowerPoint .pptx，生成幻灯片、调整版式、替换素材、设置母版或修复演示文件时使用。
---

# PPTX

## 适用场景

- 用户明确提到 `.pptx`、演示文稿、幻灯片、deck、pitch deck。
- 需要读取文本、生成缩略图、增删页面、清理垃圾引用或 XML 级修复。
- 需要将解包后的 PPTX 目录修改后再重新打包。
- 需要将 AI 生成的 SVG 转换为原生可编辑 PPTX。
- 如果用户要从零生成完整演示文稿，应使用 [ppt-generate](../ppt-generate/SKILL.md)。
- 如果用户还没有版式方案，可先走 [ppt-visual](../ppt-visual/SKILL.md)。

## 核心约束

- 优先判断是“内容编辑”还是“文件修复”；不同场景用不同脚本。
- 增删页面后必须清理关系文件和未引用资源，避免回包损坏。
- 修改完解包目录必须校验，再导出最终 `.pptx`。
- 需要高层视觉方向时，不要直接跳过 [ppt-visual](../ppt-visual/SKILL.md)。

## 代码模式

配套说明文档：

- [editing.md](editing.md) — 模板编辑工作流
- [pptxgenjs.md](pptxgenjs.md) — PptxGenJS 编程生成
- [references/svg-subset.md](references/svg-subset.md) — AI 生成 SVG 的子集规范
- [references/chart-templates.md](references/chart-templates.md) — 12 种图表 SVG 模板
- [references/quality-review.md](references/quality-review.md) — 质量评审清单

```bash
# 编辑已有 PPTX
python3 scripts/thumbnail.py slides.pptx slides-preview --cols 4
python3 scripts/office/unpack.py slides.pptx unpacked
python3 scripts/add_slide.py unpacked slide2.xml
python3 scripts/clean.py unpacked
python3 scripts/office/pack.py unpacked slides-fixed.pptx --validate true

# SVG → PPTX 生成流程
node scripts/svg_quality_checker.mjs svg_output/     # 校验 SVG 子集合规
python3 scripts/svg_to_pptx.py svg_output/ output.pptx  # 转换为原生 DrawingML
```

## 检查清单

- 是否确认最终交付必须是 `.pptx` 而不是图片或 PDF。
- 增删页面后是否同步更新了关系、内容类型和 presentation 索引。
- 清理未引用文件后是否重新校验并打开抽查。
- 若需要快速总览，是否先生成缩略图再决定逐页修改。
- 如需先确定视觉方向，是否已调用 [ppt-visual](../ppt-visual/SKILL.md)。
- 如从 SVG 生成，是否先运行 `svg_quality_checker.mjs` 校验。
- SVG 转换后是否打开 PPTX 抽查可编辑性。

## 反模式

### FAIL: 删 XML 不更新关系

```bash
unzip slides.pptx
rm ppt/slides/slide5.xml
zip -r slides.pptx .
# 打开报错：[Content_Types].xml 仍引用 slide5
# presentation.xml 仍含 slide5 sldId
```

### PASS: 完整流程

```bash
python3 scripts/office/unpack.py slides.pptx unpacked
# 删除目标 slide
rm unpacked/ppt/slides/slide5.xml
# 关键：清理引用
python3 scripts/clean.py unpacked
# 校验 + 打包
python3 scripts/office/pack.py unpacked slides-fixed.pptx --validate true
```

### FAIL: 设计未定就 XML 调整

```
直接编辑 unpacked/ppt/slides/slide3.xml：
- 调字体颜色
- 改字号
- 移动文本框位置
→ 客户："视觉方向想换风格" → XML 修改全部作废
```

### PASS: 先视觉再 XML

```
1. 调用 ppt-visual 定 5 要素
2. 用户确认风格
3. 才进入 PPTX 文件编辑
```
