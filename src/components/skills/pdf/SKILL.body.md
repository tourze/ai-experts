## 核心约束

- 先判断是“可填写表单”还是“视觉表单”，两条链路不要混用。
- 填表前必须先跑字段发现脚本，确认字段 ID、页码和合法值。
- 视觉型 PDF 的写入坐标要经过图片标注或抽样核对，不能凭感觉填。
- PDF 写回后至少人工检查一页关键字段，避免字段错位或字体异常。

## 代码模式

先看补充文档：

- [forms.md](forms.md)
- [reference.md](reference.md)
- [scripts/check_fillable_fields.mjs](scripts/check_fillable_fields.mjs)
- [scripts/extract_form_field_info.py](scripts/extract_form_field_info.py)

```bash
node scripts/check_fillable_fields.mjs form.pdf
python3 scripts/extract_form_field_info.py form.pdf fields.json
python3 scripts/fill_fillable_fields.py form.pdf fields.json filled.pdf
python3 scripts/fill_pdf_form_with_annotations.py scanned.pdf fields.json annotated.pdf
```

## 检查清单

- 是否区分了可填写表单与视觉型表单。
- 是否先提取字段信息，再让用户或上游流程生成字段值 JSON。
- 对复选框、单选组、下拉框是否检查了合法取值，而不是直接塞文本。
- 若走视觉型写入，是否结合标注图或页面截图做了位置核验。
- 只需抽取文本/表格时，是否切换到 [pdf-extraction](references/pdf-extraction.md)。

## 反模式

### FAIL: 不探测字段直接填

```python
filler.fill("form.pdf", {"name": "...", "address": "..."}, "out.pdf")
# 字段实际叫 "applicant_name" / "addr_line1" → 全部填空
```

### PASS: extract → fill

```bash
node scripts/check_fillable_fields.mjs form.pdf  # 是否可填表
python3 scripts/extract_form_field_info.py form.pdf fields.json  # 拿到真实字段名
# 编辑 fields.json
python3 scripts/fill_fillable_fields.py form.pdf fields.json filled.pdf
```

### FAIL: 视觉型当填写型

```python
# scanned.pdf 是扫描件，无 AcroForm 字段
filler.fill("scanned.pdf", values, "out.pdf")
# 输出和原件一模一样，写不进去
```

### PASS: 走标注路径

```bash
node scripts/check_fillable_fields.mjs scanned.pdf
# → "no fillable fields detected, use annotation mode"
python3 scripts/fill_pdf_form_with_annotations.py scanned.pdf coords.json out.pdf
# coords.json 含每个字段的 page + x/y + 字号
```
