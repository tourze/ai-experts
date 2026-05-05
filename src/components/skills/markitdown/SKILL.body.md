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

## 检查清单

- 是否确认了输入目录、输出目录、扩展名过滤和递归策略。
- 是否在批量模式下保留了原文件名与层级，便于回溯原件。
- AI 模式是否只在有图像理解需求时启用，并明确模型与密钥来源。
- 对学术文献是否输出了 `INDEX.md` 或 `catalog.json` 这类导航文件。
- 后续若还要导出 PDF，可转给 [md-to-pdf](../md-to-pdf/SKILL.md)。

## 反模式

### FAIL: 输出覆盖原件

```bash
markitdown input/*.pdf > input/  # 输出到同目录
# 同名 .md 覆盖了重要 PDF
```

### PASS: 输出独立目录

```bash
node scripts/batch_convert.mjs input/ output/ --recursive
# 原件不动，转换结果在 output/
```

### FAIL: 不加扩展过滤

```bash
node scripts/batch_convert.mjs /home/user/ output/ --recursive
# 把 .git / node_modules / *.tmp 全部尝试转换
# 几小时后失败一半 / 输出乱
```

### PASS: 显式扩展

```bash
node scripts/batch_convert.mjs papers/ output/ \
  --extensions .pdf .docx .pptx --recursive
# 只处理目标格式
```

### FAIL: 转完不抽查

```
输出 200 个 .md → 直接入库
→ 后续发现：表格全错位 / 图片 alt 缺失 / 公式被吞
```

### PASS: 关键页抽样

```bash
# 至少 5% 文件人工对照原 PDF 检查：
# - 表格列对齐
# - 公式 / 代码块完整
# - 标题层级
# 异常率 > 5% → 检查参数 / 换工具
```
