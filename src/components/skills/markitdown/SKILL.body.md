## 代码模式

先看参考资料：

- [references/file_formats.md](references/file_formats.md)
- [references/api_reference.md](references/api_reference.md)
- [assets/example_usage.md](assets/example_usage.md)

```bash
node scripts/batch_convert.mjs input/ output/ --extensions .pdf .docx --recursive
node scripts/convert_literature.mjs papers/ literature-md/ --organize-by-year --create-index
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" node scripts/convert_with_ai.mjs slide.png slide.md --prompt-type presentation
```
