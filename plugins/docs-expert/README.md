# docs-expert

文档专家插件，覆盖 Word/PPT/Excel/PDF 读写转换、Markdown/Mermaid 写作、Mermaid 成品图渲染、结构化表达和 README 生成。

## 结构

- `hooks/`：1 个 UserPromptSubmit 结构化表达 primer。
- `skills/`：文档处理、提案撰写、Markdown/PDF 转换等技能目录。
- `tests/`：skill 文档和脚本语法的最小回归测试。

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
| `proposal-review` | 提案方法论评审 |
| `proposal-writer` | 商业提案撰写 |
| `ppt-generate` | 当用户要从零生成演示文稿、从文档/主题生成 PPT、或要求 AI 端到端制作幻灯片时使用。 |

## Agents

| Agent | 用途 |
|-------|------|
| `doc-reviewer` | review documentation for completeness, accuracy, structure, readability, and consistency |

## Hooks

- `UserPromptSubmit`：当用户请求架构、链路、迁移、阶段计划、风险拆解或方案对比时，注入纯文本可视化与结构化表达规则，并主动引导使用 `pretty-mermaid` 产出成品图。
- 设计原则：全部 `report` / `context`、不 `block`，保证插件加载路径保持 fail-open。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/docs-expert/tests/*.test.mjs
find plugins/docs-expert -type f -name '*.py' -print0 | xargs -0 python3 -m py_compile
find plugins/docs-expert -type f \( -name '*.js' -o -name '*.mjs' \) | while read -r file; do node --check "$file"; done
```
