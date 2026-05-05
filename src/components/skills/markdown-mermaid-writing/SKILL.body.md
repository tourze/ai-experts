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
