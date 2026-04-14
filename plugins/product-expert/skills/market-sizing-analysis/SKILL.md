---
name: market-sizing-analysis
description: 当用户要计算 TAM/SAM/SOM、验证市场空间、支撑商业计划或融资叙事时使用；支持 top-down、bottom-up 和 value theory 三种方法。
---

# 市场规模分析

## 适用场景
- 创业立项、融资材料、年度规划或新市场机会评估。
- 需要参考 [references/data-sources.md](references/data-sources.md) 与 [examples/saas-market-sizing.md](examples/saas-market-sizing.md)。
- 与客户画像或融资故事联动时，可配合 [startup-icp-definer](../startup-icp-definer/SKILL.md) 和 [fundraise-advisor](../fundraise-advisor/SKILL.md)。

## 核心约束
- 同时给出方法、假设和数据来源，不允许只报一个大数字。
- TAM/SAM/SOM 要口径一致，避免一个按用户数、一个按收入口径混算。
- 对新市场或新类别，优先写假设边界和不确定性，而不是装作数字很精确。

## 代码模式
```markdown
| 方法 | 假设 | 公式 | 结果 |
| --- | --- | --- | --- |
| Top-down | ... | 市场总盘子 × 可服务比例 | ... |
```

## 检查清单
- [ ] 已说明数据来源、年份、地区和口径。
- [ ] 至少使用两种方法交叉验证结果。
- [ ] SAM/SOM 与渠道能力、ICP 和资源约束一致。
- [ ] 对不确定性和关键敏感参数有说明。

## 反模式
- 直接拿全球市场规模当自己可拿到的市场。
- 漏掉地域、客群或定价差异。
- 为了好看故意放大数字而不写前提。
