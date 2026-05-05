## 代码模式

```text
1. 范围决策：默认 current-session；显式"今天 + 主题"才走 today-topic-synthesis
2. 输出位置决策：读记忆文件 → 没有就问 → 用户给出后建议写回记忆文件
3. Step 1: 草拟问题对比表（问题 | 现象/信号 | 核心判断 | 影响）→ 等用户确认主要问题
4. Step 2: 草拟结论对比表（主题 | 结论 | 依据 | 风险/边界）+ 关键结论编号列表 → 等用户确认结论
5. Step 3: 套用 references/output-template.md 落盘 → 回报绝对路径
```

跨会话场景第一版不做自动 transcript 检索；由用户提供具体会话或要点，frontmatter 标 `source: today-topic-synthesis`。
