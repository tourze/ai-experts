# 答案引擎与生成引擎优化（aeo-geo）

## 适用场景
- 让内容出现在 AI Overview、Featured Snippet、语音搜索和 AI 助手引用结果中。
- 审计品牌在 AI 回答中的可见性（AI Citation Audit）。
- 把现有内容重构为 AI 可提取的格式。

## 核心约束
- AEO 面向结构化答案提取；GEO 面向 AI 模型引用概率。两者互补，不可只做一个。
- 统计和专家引言必须标注来源；AI 模型优先引用有出处的内容。
- 不要为了 AI 可读性牺牲人类读者体验；AI 优化是叠加层，不是替代层。
- 传统排名配合 [seo](../SKILL.md)；内容主题配合 [content-strategy](../../content-strategy/SKILL.md)。

## 代码模式

### AEO：用标准块格式化内容

按 [aeo-content-blocks](./aeo-content-blocks.md) 中的模板，常用 6 种：
- **Definition Block** — "什么是 X"查询
- **Step-by-Step Block** — "怎么做 X"查询，目标列表 Snippet
- **Comparison Table Block** — "X vs Y"查询，目标表格 Snippet
- **Pros/Cons Block** — "X 值得吗"评估查询
- **FAQ Block** — 自然语言提问，答案 50-100 词，适配 FAQ Schema
- **Listicle Block** — "最好的 X"、"Top N"查询

### GEO：提升被 AI 引用的概率

按 [geo-citation-patterns](./geo-citation-patterns.md) 中的模式：
- **统计引用块**：数据声明附来源、年份、机构名（引用率 +15-30%）
- **专家引言块**：具名专家 + 头衔 + 直接引语
- **自包含答案块**：无需上下文即可理解的 2-3 句陈述
- **证据三明治块**：声明 → 3 条带来源证据 → 可执行结论

### AI 引用审计流程

1. 生成 100+ 高商业意图 prompt（推荐/对比/功能/场景/价格/迁移 6 类）
2. 按主题聚类 5-10 组
3. 抽样 10-15 核心 prompt 在 ChatGPT/Perplexity 运行，记录品牌提及与引用源
4. 差距分析 → 优先行动计划

## 检查清单
- 前 1-2 句是否直接回答目标查询（不埋在叙述后）。
- 是否有 Key Takeaways 块（3-5 条带具体数字的结论，紧跟引言后）。
- Meta description 是否直接回答查询（不只做预告）。
- 每个 H2/H3 是否聚焦单一清晰概念。
- 统计数据是否带来源和年份。
- 是否有至少 1 个自包含答案块。

## 反模式

### FAIL: 答案埋在第三段

```
## 什么是项目管理工具？
项目管理是一门源远流长的学科... → AI 提取第一句，拿到废话
```

### PASS: 直接回答再展开

```
## 什么是项目管理工具？
项目管理工具是帮助团队规划任务、跟踪进度和协作的软件。
```

### FAIL: 数据无来源

```
研究表明，70% 的用户更喜欢... → AI 无法验证，不引用
```

### PASS: 数据带出处

```
根据 Gartner 2025 年对 1,200 家企业的调研，70% 的决策者在联系销售前已完成自主调研。
```