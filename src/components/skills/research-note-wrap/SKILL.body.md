## 代码模式

```text
1. 范围决策：默认 current-session；显式"今天 + 主题"才走 today-topic-synthesis
2. 输出位置决策：读记忆文件 → 没有就问 → 用户给出后建议写回记忆文件
3. Step 1: 草拟问题对比表（问题 | 现象/信号 | 核心判断 | 影响）→ 等用户确认主要问题
4. Step 2: 草拟结论对比表（主题 | 结论 | 依据 | 风险/边界）+ 关键结论编号列表 → 等用户确认结论
5. Step 3: 套用 references/output-template.md 落盘 → 回报绝对路径
```

跨会话场景第一版不做自动 transcript 检索；由用户提供具体会话或要点，frontmatter 标 `source: today-topic-synthesis`。

## 反模式

完整 FAIL/PASS 对照见 [反模式集](references/anti-patterns.md)。摘要：

| 反模式 | 摘要 | 正确做法 |
|---|---|---|
| 单步落盘 | 没确认就写文件 | 双步确认后落盘 |
| 流水账叙事 | 把对话过程照抄 | 表格承担密度 |
| 干甩 path:line | 只丢路径不解释 | 三件事都到位 |
| 错触发 | 把外部转写当输入 | 转手到 meeting-notes-and-actions |
