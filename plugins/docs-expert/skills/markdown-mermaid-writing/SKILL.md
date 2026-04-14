---
name: markdown-mermaid-writing
description: 当用户要用 Markdown 和 Mermaid 产出报告、技术文档、研究材料、决策记录或图表型说明时使用。该技能把文本化文档和文本化图示作为默认交付标准。
---

# Markdown 与 Mermaid 写作

## 适用场景

- 需要用纯文本格式维护文档，并希望图表可审阅、可 diff、可版本管理。
- 用户要写技术方案、研究报告、状态汇报、PR 描述、决策记录或展示稿。
- 文档中需要流程图、时序图、状态图、甘特图、ER 图等 Mermaid 图示。
- 若不仅要源码，还要主题化 SVG 或终端 ASCII 成品图，继续使用 [pretty-mermaid](../pretty-mermaid/SKILL.md)。
- 若最终要导出 PDF，可继续使用 [md-to-pdf](../md-to-pdf/SKILL.md)。

## 核心约束

- 先确定文档类型，再选模板和图表；不要先画图后找地方塞进去。
- Markdown 与 Mermaid 都要走已有样式规范，避免同仓库里出现多套写法。
- 图要服务于结论，不要为了“好看”而堆无效形状。
- 复杂主题先拆成多个小图，不要把所有逻辑塞进一张图。

## 代码模式

优先读取这些规范与模板：

- [references/markdown_style_guide.md](references/markdown_style_guide.md)
- [references/mermaid_style_guide.md](references/mermaid_style_guide.md)
- [templates/project_documentation.md](templates/project_documentation.md)
- [templates/pull_request.md](templates/pull_request.md)

```bash
cp templates/project_documentation.md draft.md
sed -n '1,40p' references/markdown_style_guide.md
sed -n '1,40p' references/mermaid_style_guide.md
```

常见图示可以从下面的骨架开始：

```markdown
~~~mermaid
flowchart TD
    A[需求输入] --> B[分析]
    B --> C[文档起草]
    C --> D[评审与修订]
~~~
```

## 检查清单

- 是否先选好了模板，而不是每次从空白页开始。
- 是否读取了对应的样式指南，保证标题、列表、图表命名一致。
- 图表是否真正回答了读者问题，而不是只是把文字搬成方框。
- 是否考虑了后续导出或展示场景，例如给 [md-to-pdf](../md-to-pdf/SKILL.md) 使用时的分页和宽度。
- 交付前是否检查了 Mermaid 代码块的语法与节点命名。

## 反模式

- 同一份文档同时混用多套标题和图表风格。
- 流程还没想清楚，就先画一张无法落地的大图。
- 把 Mermaid 当截图替代品，导致内容不可维护。
- 模板、正文、图表各写各的，最终结构失控。
