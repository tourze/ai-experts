---
name: markitdown
description: 当用户要把 PDF、DOCX、PPTX、XLSX、图片、HTML、音频或其他文件批量转换为 Markdown 时使用。支持普通转换、学术文献整理和带 AI 图片描述的增强转换。
---

# MarkItDown

## 适用场景

- 目标是把多种格式统一转成 Markdown，供总结、检索、二次写作或知识库沉淀。
- 用户需要批量处理目录，而不是只转换单个文件。
- 用户要处理学术论文或文献库，并生成目录索引、元数据清单。
- 当用户只处理单个 Office 文件且最终仍要保留原格式时，优先使用 [docx](../docx/SKILL.md)、[pptx](../pptx/SKILL.md) 或 [xlsx](../xlsx/SKILL.md)。

## 核心约束

- 先确认输出真的是 Markdown；如果最终要的是原格式回写，不要误用。
- AI 增强模式依赖 `openai` 兼容客户端与 API key，只在确实需要图片理解时开启。
- 批量转换时保留原目录结构与文件扩展映射，避免输出目录混乱。
- 学术文献场景下优先补齐文件命名和元数据，再做批量转换。

## 代码模式

先看参考资料：

- [references/file_formats.md](references/file_formats.md)
- [references/api_reference.md](references/api_reference.md)
- [assets/example_usage.md](assets/example_usage.md)

```bash
python3 scripts/batch_convert.py input/ output/ --extensions .pdf .docx --recursive
python3 scripts/convert_literature.py papers/ literature-md/ --organize-by-year --create-index
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" python3 scripts/convert_with_ai.py slide.png slide.md --prompt-type presentation
```

## 检查清单

- 是否确认了输入目录、输出目录、扩展名过滤和递归策略。
- 是否在批量模式下保留了原文件名与层级，便于回溯原件。
- AI 模式是否只在有图像理解需求时启用，并明确模型与密钥来源。
- 对学术文献是否输出了 `INDEX.md` 或 `catalog.json` 这类导航文件。
- 后续若还要导出 PDF，可转给 [md-to-pdf](../md-to-pdf/SKILL.md)。

## 反模式

- 用户只要提炼内容，却把原始文件覆盖掉。
- 目录很大却不开扩展过滤，最后把无关文件也转进去。
- 没有 API key 还默认走 AI 模式，导致整批失败。
- 把转出来的 Markdown 当成绝对准确原文，不做抽样校验。
