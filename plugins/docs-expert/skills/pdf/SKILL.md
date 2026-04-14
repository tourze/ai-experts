---
name: pdf
description: 当任务涉及 PDF 文件的读取、表单识别、表单填写、批注写入、结构分析或图片转换时使用。该技能覆盖脚本化处理和人工校验配合的 PDF 工作流。
---

# PDF

## 适用场景

- 用户要处理 `.pdf` 文件本身，而不是只抽文本。
- 需要判断 PDF 是否可填写、提取字段信息、按 JSON 回填、或通过注释方式写入内容。
- 需要把 PDF 渲染成图片，或根据坐标/框选信息做人工校验。
- 纯抽取场景优先看 [pdf-extraction](../pdf-extraction/SKILL.md)。

## 核心约束

- 先判断是“可填写表单”还是“视觉表单”，两条链路不要混用。
- 填表前必须先跑字段发现脚本，确认字段 ID、页码和合法值。
- 视觉型 PDF 的写入坐标要经过图片标注或抽样核对，不能凭感觉填。
- PDF 写回后至少人工检查一页关键字段，避免字段错位或字体异常。

## 代码模式

先看补充文档：

- [forms.md](forms.md)
- [reference.md](reference.md)
- [scripts/check_fillable_fields.py](scripts/check_fillable_fields.py)
- [scripts/extract_form_field_info.py](scripts/extract_form_field_info.py)

```bash
python3 scripts/check_fillable_fields.py form.pdf
python3 scripts/extract_form_field_info.py form.pdf fields.json
python3 scripts/fill_fillable_fields.py form.pdf fields.json filled.pdf
python3 scripts/fill_pdf_form_with_annotations.py scanned.pdf fields.json annotated.pdf
```

## 检查清单

- 是否区分了可填写表单与视觉型表单。
- 是否先提取字段信息，再让用户或上游流程生成字段值 JSON。
- 对复选框、单选组、下拉框是否检查了合法取值，而不是直接塞文本。
- 若走视觉型写入，是否结合标注图或页面截图做了位置核验。
- 只需抽取文本/表格时，是否切换到 [pdf-extraction](../pdf-extraction/SKILL.md)。

## 反模式

- 不先探测字段，直接往 PDF 里盲填。
- 把视觉型表单当可填写表单处理，最后写不进去。
- 发现字段值报错后继续生成输出 PDF，造成脏数据。
- 写回后不校验版面，结果文本遮挡原表格或跑到错误页。
