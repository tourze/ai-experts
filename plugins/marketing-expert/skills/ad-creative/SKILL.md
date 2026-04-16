---
name: ad-creative
description: 在需要批量生成、迭代或放大广告创意时使用；若重点是投放结构与预算，改用 `paid-ads`，若重点是落地页文案，改用 `copy-editing`。
---

# 广告创意（ad-creative）

## 适用场景
- 为 Google Ads、Meta、LinkedIn、TikTok 等平台批量生成广告标题、描述和主文案。
- 根据已有高低表现素材做迭代，而不是从零写一条“看起来还行”的广告。
- 需要同时给出创意角度、变量矩阵和平台尺寸约束。

## 核心约束
- 先确认平台、版位、受众、转化目标，再写创意；不同渠道不能混用同一套文案假设。
- 所有输出必须遵守 [platform-specs](references/platform-specs.md) 中的字符与组合限制。
- 创意迭代要基于角度、利益点、痛点、CTA 变量拆分，不能只做同义词改写。
- 若任务转向预算、出价、受众分层，切到 [paid-ads](../paid-ads/SKILL.md)；若转向落地页文案，切到 [copy-editing](../copy-editing/SKILL.md)。

## 代码模式
- 产出模板：

```md
渠道：Meta Feed
受众：电商品牌市场负责人
目标：获取演示预约

角度矩阵：
1. ROI 压力
2. 投放效率
3. 团队协作

输出：
- 标题 10 条
- 主文案 5 条
- CTA 3 条
- 不建议触碰的表达 5 条
```

- 需要补充平台约束或生成思路时，优先查阅 [platform-specs](references/platform-specs.md) 和 [generative-tools](references/generative-tools.md)。

## 检查清单
- 是否明确了平台、版位、受众、CTA 和禁用词。
- 是否至少覆盖 3 个创意角度，而不是单一表述。
- 是否区分“吸引点击”和“促成转化”的文案层级。
- 是否保留可复盘的变量命名，方便后续实验。

## 反模式
- 在不知道平台限制时直接批量输出，导致上线前大面积截断。
- 把“创意迭代”做成近义句堆叠，没有新增角度。
- 既写投放策略又写创意细节，导致责任边界混乱。
