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
