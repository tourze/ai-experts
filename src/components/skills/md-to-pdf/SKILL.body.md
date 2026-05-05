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
