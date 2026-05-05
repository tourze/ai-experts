## 执行流程

1. 建立 `brief`，字段和材料分类见 [tutorial package contract](references/tutorial-package-contract.md)。
2. 判断用户材料等级：rich / moderate / thin，并据此控制外部研究预算。
3. 先写来源登记和 evidence map，再写大纲；不要边搜边写正文。
4. 每章包含目标、概念、视觉、例子、坑、练习、checkpoint 和 source IDs。

## 代码模式

```json
{
  "topic": "",
  "audience": "",
  "learning_goal": "",
  "language": "zh-CN",
  "material_tier": "rich | moderate | thin",
  "output_formats": ["markdown", "docx", "pdf", "html"]
}
```

```markdown
## 第1章 章节标题
### 1.1 小节标题
### 1.2 小节标题
```

## 章节视觉

先写 `visual-spec`，不要直接堆装饰图：

```json
{
  "chapter": 1,
  "visual_type": "flow | concept-map | comparison | timeline | architecture | checklist",
  "learning_point": "",
  "elements": [],
  "caption": ""
}
```
