# docs-expert

文档与知识管理专家能力，覆盖 PDF/PPT 生成与转换、Markdown/Mermaid 写作、结构化表达、README 生成、商业提案、深度研究、教程编写，以及 Obsidian 笔记 Bases 工作流。

## 结构

- `hooks/`：1 个 UserPromptSubmit 结构化表达 primer。
- `skills/`：文档处理、提案撰写、Markdown/PDF 转换等技能目录。
- `tests/`：skill 文档和工具语法的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `comparative-analysis` | 当用户要对比两个或多个仓库、框架、方案、工具或系统时使用 |
| `consulting-analysis` | 专业研究报告与咨询分析 |
| `deep-code-read` | 深度理解不熟悉代码库，生成可复用的认知型 skill 文件 |
| `deep-research` | 联网做事实研究、概念解释、竞品比较、趋势梳理或基于外部信息的前置调研 |
| `doc-coauthoring` | 结构化文档协同写作流程 |
| `markdown-mermaid-writing` | Markdown + Mermaid 图表写作 |
| `markitdown` | 文件/Office 文档转 Markdown |
| `md-to-pdf` | Markdown 转 PDF（含 Mermaid 支持） |
| `obsidian-bases` | Obsidian Bases `.base` 文件、视图、过滤、公式、摘要与嵌入模式 |
| `pdf` | PDF 文件读写操作 |
| `ppt-generate` | 从零生成演示文稿、从文档/主题生成 PPT、或 AI 端到端制作幻灯片 |
| `proposal-writer` | 商业提案撰写 |
| `readme-blueprint-generator` | 智能 README.md 生成 |
| `research-note-wrap` | 把当前调研或分析会话压成高密度 Markdown 结论笔记 |
| `tutorial-builder` | 来源支撑的完整教程、学习包、章节视觉与导出规划 |
| `user-guide-writing` | 用户指南与教程写作 |
| `web-content-fetcher` | 当用户给出具体 URL，需要抓取网页正文并转成 Markdown 时使用 |

## Agents

| Agent | 用途 |
|-------|------|
| `doc-reviewer` | review documentation for completeness, accuracy, structure, readability, and consistency |
| `document-producer` | 多格式文档产出（PPT/Word/Excel/PDF/Markdown）与互转编排，可写盘 |
| `research-intelligence-analyst` | 外部事实研究、网页正文抓取、多来源对比与研究笔记沉淀，可写 Markdown 报告或 Obsidian 笔记 |

## Hooks

- `UserPromptSubmit`：当用户请求架构、链路、迁移、阶段计划、风险拆解或方案对比时，注入纯文本可视化与结构化表达规则，并主动引导使用 `pretty-mermaid` 产出成品图。
- 设计原则：全部 `report` / `context`、不 `block`，保证 hook 加载路径保持 fail-open。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/docs-expert/tests/*.test.mjs
find plugins/docs-expert -type f -name '*.py' -print0 | xargs -0 python3 -m py_compile
find plugins/docs-expert -type f \( -name '*.js' -o -name '*.mjs' \) | while read -r file; do node --check "$file"; done
```
