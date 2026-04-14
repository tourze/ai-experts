---
name: competitive-teardown
description: 当用户要做深度竞品拆解、评分矩阵、定位分析、定价比较或季度复盘时使用；输出结构化竞品分析、差距判断与行动建议。
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
- 没有评分规则就直接打分。
- 用零散截图替代可比较的结构化结论。
- 因为对手功能多，就默认其战略更强。
