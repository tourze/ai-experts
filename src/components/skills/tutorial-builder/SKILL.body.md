## 执行流程

1. 建立 `brief`，字段和材料分类见 [tutorial package contract](references/tutorial-package-contract.md)。
2. 判断用户材料等级：rich / moderate / thin，并据此控制外部研究预算。
3. 先写来源登记和 evidence map，再写大纲；不要边搜边写正文。
4. 每章包含目标、概念、视觉、例子、坑、练习、checkpoint 和 source IDs。
5. 以 Markdown 为源规划 DOCX/PDF/HTML 导出；具体转换分别衔接 [docx](../doc-coauthoring/SKILL.md)、[md-to-pdf](../md-to-pdf/SKILL.md)。

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

需要渲染 Mermaid 成品图时衔接 [pretty-mermaid](../markdown-mermaid-writing/SKILL.md)；需要演示视觉规范时衔接 [ppt-visual](../ppt-generate/SKILL.md)。

## 检查清单

- [ ] 已分类用户材料，并说明 rich / moderate / thin 研究等级。
- [ ] 每章都有 source IDs、视觉说明、练习和 checkpoint。
- [ ] 重要事实有官方、论文、实现或可追溯来源支撑。
- [ ] 用户材料足够强时，它是教程主线；外部研究只补缺口。
- [ ] 导出格式以同一份 Markdown 为源，DOCX/PDF/HTML 没有内容分叉。

## 反模式

### FAIL: 链接摘要伪装成教程

```
第 1 节：来源 A 说了什么
第 2 节：来源 B 说了什么
第 3 节：来源 C 说了什么
→ 学习者不知道先学什么，也没有练习路径
```

### PASS: 来源变成学习路径

```
第 1 章：先建立心智模型 [A1][P1]
第 2 章：用一个例子走完整流程 [G1]
第 3 章：解释常见失败模式 [P2][X1]
```

### FAIL: 三份导出三份内容

```
tutorial.md、tutorial.docx、tutorial.html 各自手改
→ 一处更新，另外两处过时
```

### PASS: Markdown 单一来源

```
tutorial.md -> docx / pdf / html
导出失败只修源或导出配置，不手动维护分叉正文
```
