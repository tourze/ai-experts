---
name: pptx
description: 当用户要创建、读取、编辑或修复 .pptx 演示文稿时使用。
---

# PPTX

## 适用场景

- 用户明确提到 `.pptx`、演示文稿、幻灯片、deck、pitch deck。
- 需要读取文本、生成缩略图、增删页面、清理垃圾引用或 XML 级修复。
- 需要将解包后的 PPTX 目录修改后再重新打包。
- 如果用户还没有版式方案，可先走 [ppt-visual](../ppt-visual/SKILL.md)。

## 核心约束

- 优先判断是“内容编辑”还是“文件修复”；不同场景用不同脚本。
- 增删页面后必须清理关系文件和未引用资源，避免回包损坏。
- 修改完解包目录必须校验，再导出最终 `.pptx`。
- 需要高层视觉方向时，不要直接跳过 [ppt-visual](../ppt-visual/SKILL.md)。

## 代码模式

配套说明文档：

- [editing.md](editing.md)
- [pptxgenjs.md](pptxgenjs.md)
- [scripts/add_slide.py](scripts/add_slide.py)
- [scripts/clean.py](scripts/clean.py)

```bash
python3 scripts/thumbnail.py slides.pptx slides-preview --cols 4
python3 scripts/office/unpack.py slides.pptx unpacked
python3 scripts/add_slide.py unpacked slide2.xml
python3 scripts/clean.py unpacked
python3 scripts/office/pack.py unpacked slides-fixed.pptx --validate true
```

## 检查清单

- 是否确认最终交付必须是 `.pptx` 而不是图片或 PDF。
- 增删页面后是否同步更新了关系、内容类型和 presentation 索引。
- 清理未引用文件后是否重新校验并打开抽查。
- 若需要快速总览，是否先生成缩略图再决定逐页修改。
- 如需先确定视觉方向，是否已调用 [ppt-visual](../ppt-visual/SKILL.md)。

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
