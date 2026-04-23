# Question Refiner 反模式与完整交互示例

## FAIL: 澄清没到位就生成 prompt

```
用户只回答了"要完整报告"
助手：[立即生成 prompt，CONSTRAINTS 和 KEYWORDS 字段空着]
→ 研究阶段又回来问一遍
```

## PASS: 缺字段继续补问

```
助手：还有 2 个关键字段需要补：
- 时间窗口（默认近 3 年？还是要看长期趋势？）
- 来源优先（同行评审 / 行业报告 / 都可以？）
```

## FAIL: 帮用户"猜"答案

```
用户没说地域 → 助手默认"全球"并生成 prompt
→ 用户本意是"只看中国" → 返工
```

## PASS: 明确空缺不猜

```
助手：地域范围没提，以下哪个：
A. 全球
B. 仅中国
C. 中美欧对比
D. 其他
```

## 完整交互示例

**用户**：
> 研究一下 AI 在医疗的应用

**助手（批量 5 题，带选项）**：
> 动手前请回答：
>
> 1. 焦点：A 临床诊断 / B 药物发现 / C 医院运营 / D 全部
> 2. 输出：A 2-3 页摘要 / B 20-30 页报告 / C 市场预测含图表
> 3. 范围：地域（全球 / 中美欧 / 中国）+ 时间窗（近 3 年 / 近 5 年）
> 4. 来源：A 仅同行评审 / B 含行业报告 / C 含新闻 / D 混合
> 5. 受众：A 决策者 / B 技术团队 / C 投资人

**用户**：
> 1-A，2-B，3 全球近 3 年，4 混合优先 A-B 级，5 决策者

**助手生成 prompt**：

```markdown
### TASK
研究 AI 在临床诊断与治疗中的应用现状与趋势。

### CONTEXT
面向医疗决策者，驱动 AI 采购与部署决策。

### SPECIFIC QUESTIONS
1. AI 临床诊断当前主流技术路线？
2. 代表性应用与临床效果（准确率、时效）？
3. 监管路径（FDA、NMPA、CE）？
4. 主要供应商与市场份额？
5. 采购与部署的常见障碍？

### KEYWORDS
AI in clinical diagnosis, medical imaging AI, FDA AI medical device, FDA 510(k), diagnostic AI, 临床决策支持

### CONSTRAINTS
- 时间：2022-2025
- 地域：全球（重点 US / EU / CN）
- 来源：同行评审 + 行业报告（Gartner / IDC / Rock Health）
- 显式排除：消费级健康 app

### OUTPUT FORMAT
- 完整报告 20-30 页
- inline URL 引用
- 含对比表格（供应商 × 能力）

### FINAL INSTRUCTIONS
- 每条声明附作者 / 日期 / 标题 / URL
- 冲突信息显式标注，不择一
- 交付后运行 citation-validator
```
