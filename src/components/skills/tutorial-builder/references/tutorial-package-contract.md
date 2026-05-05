# Tutorial Package Contract

## Brief

```json
{
  "topic": "",
  "audience": "",
  "learning_goal": "",
  "language": "zh-CN",
  "user_materials": [],
  "must_use": [],
  "exclude": [],
  "output_formats": ["markdown", "docx", "pdf", "html"]
}
```

## 用户材料分类

| 类型 | 用法 |
|------|------|
| `must_use` | 教程主线、案例或关键论点 |
| `supporting` | 局部例子、数据、补充材料 |
| `style_reference` | 文风、版式、视觉参考，只提炼规则 |
| `caution` | 可能过时、偏营销、缺证据或有争议 |
| `exclude` | 用户明确不要使用 |

## 研究预算

- Rich packet：用户已有草稿、5+ URL/文件、明确论文/仓库/案例；只补 `3-8` 个来源做验证、更新、反例和实现证据。
- Moderate packet：有主题和少量材料；补 `6-12` 个来源覆盖缺口。
- Thin packet：只有主题或一句话；补 `10-18` 个来源，至少覆盖官方/论文/GitHub/实践讨论。

## 来源记录

```markdown
| id | title | url | type | authority_reason | use_for | key_takeaway | limits |
|----|-------|-----|------|------------------|---------|--------------|--------|
| A1 | ... | ... | official | maintainer docs | definition | ... | ... |
```

## 默认教程结构

1. Hook：真实问题或常见困惑。
2. Promise：学完能理解或完成什么。
3. Roadmap：最小学习路径。
4. 第 1 章：基础心智模型。
5. 第 2 章：第一个具体例子。
6. 第 3 章：组件如何连接。
7. 第 4 章：实践流程或实现。
8. 第 5 章：真实案例、错误和权衡。
9. 练习：任务、检查点、自评。
10. 来源附录和下一步学习路径。

每章至少包含：章节目标、普通语言概念、视觉与 caption、guided example、what to notice、常见坑、练习、checkpoint、source IDs。

## 导出口径

- `markdown`：canonical source，保留 source IDs 和附录。
- `docx`：需要 Word 交付时转 `docx`。
- `pdf`：从 Markdown 渲染时转 `md-to-pdf`，先检查 Mermaid/公式/宽表格。
- `html`：单页学习包，不做营销页；正文、视觉、练习和来源附录必须同源。
