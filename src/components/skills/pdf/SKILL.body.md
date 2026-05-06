## 代码模式

先看补充文档：

- [forms.md](forms.md)
- [reference.md](reference.md)
- [scripts/check_fillable_fields.mjs](scripts/check_fillable_fields.mjs)
- [scripts/extract_form_field_info.mjs](scripts/extract_form_field_info.mjs)

```bash
node scripts/check_fillable_fields.mjs form.pdf
node scripts/extract_form_field_info.mjs form.pdf fields.json
node scripts/fill_fillable_fields.mjs form.pdf fields.json filled.pdf
node scripts/fill_pdf_form_with_annotations.mjs scanned.pdf fields.json annotated.pdf
```
