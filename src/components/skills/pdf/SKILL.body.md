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
