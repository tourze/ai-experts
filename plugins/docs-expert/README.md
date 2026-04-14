# docs-expert

文档专家插件，覆盖 Word/PPT/Excel/PDF 读写转换、Markdown/Mermaid 写作、Mermaid 成品图渲染、结构化表达和 README 生成。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs`、`session-start` 自检脚本与 `user-prompt-submit` 结构化表达 primer。
- `skills/`：文档处理、提案撰写、Markdown/PDF 转换等技能目录。
- `tests/`：manifest、dispatch、skill 文档和脚本语法的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `doc-coauthoring` | 结构化文档协同写作流程 |
| `docx` | Word 文档创建/读取/编辑 |
| `markdown-mermaid-writing` | Markdown + Mermaid 图表写作 |
| `pretty-mermaid` | Mermaid 图表主题化渲染为 SVG / ASCII |
| `md-to-pdf` | Markdown 转 PDF（含 Mermaid 支持） |
| `pdf` | PDF 文件读写操作 |
| `pdf-extraction` | PDF 文本/表格/元数据提取 |
| `pptx` | PowerPoint 演示文稿操作 |
| `xlsx` | Excel 电子表格操作 |
| `readme-blueprint-generator` | 智能 README.md 生成 |
| `user-guide-writing` | 用户指南与教程写作 |
| `markitdown` | 文件/Office 文档转 Markdown |
| `ppt-visual` | 演示文稿视觉设计与布局 |
| `consulting-analysis` | 专业研究报告与咨询分析 |
| `enterprise-proposal` | BCG/McKinsey 风格企业提案 |
| `proposal-review` | 提案方法论评审 |
| `proposal-writer` | 商业提案撰写 |

## Hooks

- `SessionStart`：校验 `plugin.json`、`hooks/hooks.json`、`dispatch.mjs` 与所有 `SKILL.md` 是否完整存在。
- `UserPromptSubmit`：当用户请求架构、链路、迁移、阶段计划、风险拆解或方案对比时，注入纯文本可视化与结构化表达规则，并主动引导使用 `pretty-mermaid` 产出成品图。
- 设计原则：全部 `report` / `context`、不 `block`，保证插件加载路径保持 fail-open。

## 安装

```bash
claude --plugin-dir /path/to/plugins/docs-expert
```

## 验证

```bash
python3 -m json.tool plugins/docs-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/docs-expert/hooks/hooks.json >/dev/null
node --check plugins/docs-expert/hooks/dispatch.mjs
node --test plugins/docs-expert/tests/*.test.mjs
find plugins/docs-expert -type f -name '*.py' -print0 | xargs -0 python3 -m py_compile
find plugins/docs-expert -type f \( -name '*.js' -o -name '*.mjs' \) | while read -r file; do node --check "$file"; done
find plugins/docs-expert -type f -name '*.sh' | while read -r file; do bash -n "$file"; done
```
