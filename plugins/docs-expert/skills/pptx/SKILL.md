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

- 直接在压缩包里删文件，不更新关系引用。
- 加页面只复制 XML，不补内容类型和 presentation 入口。
- 为了赶进度跳过 `clean.py` 和 `pack.py --validate true`。
- 设计方案都没定，就开始微调每一页 XML。
