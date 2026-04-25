---
name: competitive-teardown
description: 当用户要深度拆解单个竞品的产品体验、功能结构、定价包装、定位叙事或增长路径时使用。
---

# 竞品拆解

## 适用场景
- 路线图评审、季度竞品复盘、对手发布重大功能或调价后的深度分析。
- 需要结合 [references/data-collection-guide.md](references/data-collection-guide.md)、[references/scoring-rubric.md](references/scoring-rubric.md)、[references/analysis-templates.md](references/analysis-templates.md) 做证据化拆解。
- 需要生成量化矩阵时，可运行 `python3 scripts/competitive_matrix_builder.py <input.json> --format text`。

## 核心约束
- 先定义维度和评分标准，再收集证据；评分必须能回溯到原始资料。
- 竞品差距分析必须排除自身样本，避免把我方分数混入竞品均值。
- 输出需要区分产品、定价、组织信号与市场动作，避免把所有信息堆成一张表。

## 代码模式
```bash
python3 scripts/competitive_matrix_builder.py competitors.json --format text
python3 scripts/competitive_matrix_builder.py competitors.json --format json --weights pricing=2,ux=1.5
```

```markdown
| 维度 | 我方 | 竞品均值 | 最强竞品 | 行动优先级 |
| --- | --- | --- | --- | --- |
```

## 检查清单
- [ ] 已明确分析范围、维度、权重和证据来源。
- [ ] 评分矩阵、SWOT、定位判断和行动建议相互一致。
- [ ] 命令参数与输入 JSON 结构匹配，脚本输出可复现。
- [ ] 结论能够回答“继续追”“差异化绕开”或“无需跟随”。

## 反模式

### FAIL: 拍脑袋打分

```
| 维度 | A | B | 我方 |
| UX  | 7 | 8 | 9   |
→ 9 是怎么来的？同事看了说"挺好"
```

### PASS: 显式 rubric

```
UX 评分标准：
- 9-10：所有核心任务 ≤ 3 步、无空态死路、a11y AAA
- 7-8：≤ 5 步、个别空态缺失
- 5-6：核心任务 > 5 步、有死路
评分需附文件路径或截图编号
```

### FAIL: 功能多 = 战略强

```
"竞品 A 有 200 个功能，我们只有 50"
→ 立项做 150 个新功能追赶
→ 实际：A 的用户只用 12 个功能，剩下都是历史包袱
```

### PASS: 看用户实际使用

```
1. 抓 A 的公开案例 / 用户访谈
2. 列出 A 用户日常实际用的 ≤ 20 个功能
3. 对比我方覆盖率和体验
4. 决定差异化或追平的 P0 列表（通常 ≤ 5 个）
```
