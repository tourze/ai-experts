# Structured Research Prompt 7 段模板

```markdown
### TASK
[一句话说清要研究什么。避免"研究 AI"这种泛题]

### CONTEXT / BACKGROUND
[为什么做这个研究；给谁用；驱动什么决策]

### SPECIFIC QUESTIONS
1. [子问题 1 — 具体到可用一条搜索覆盖]
2. [子问题 2]
3. [子问题 3]
... （3-7 条，不少于 3）

### KEYWORDS
[主关键词 / 同义词 / 英文名 / 反义词或竞品]

### CONSTRAINTS
- 时间窗口：[YYYY-MM — YYYY-MM]
- 地域范围：[全球 / 中国 / 欧美 / 特定国家]
- 来源类型：[学术 / 行业报告 / 官方 / 新闻 / 混合]
- 显式排除：[不要 X / 不关心 Y]

### OUTPUT FORMAT
- 形式：[摘要 / 全报告 / 对比矩阵 / 演示稿]
- 长度：[页数或字数]
- 引用风格：[inline URL / 脚注 / APA]
- 图表：[需要 / 不需要；类型]

### FINAL INSTRUCTIONS
- 每条事实声明附：作者/组织、日期、标题、URL
- 冲突信息显式标注，不偷偷择一
- 交付后交给 citation-validator 做发布前闭环
```

## 质量检查清单

交付 prompt 前逐条确认：

- [ ] TASK 具体（不是"研究 AI"）
- [ ] CONTEXT 说清了 why
- [ ] SPECIFIC QUESTIONS 3-7 条可操作
- [ ] KEYWORDS 覆盖主概念和同义词
- [ ] CONSTRAINTS 时间 / 地域 / 源类型都具体
- [ ] OUTPUT FORMAT 具体到长度和组件
- [ ] FINAL 强调引用规范

## 维度与 prompt 段的映射

| 澄清维度 | 填入段 |
|----------|--------|
| 核心问题 | TASK + SPECIFIC QUESTIONS |
| 输出形式 | OUTPUT FORMAT |
| 范围边界 | CONSTRAINTS |
| 来源信任 | CONSTRAINTS（来源类型）+ FINAL |
| 特殊要求 | CONTEXT（受众）+ OUTPUT（图表） |
