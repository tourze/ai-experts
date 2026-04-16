---
name: paid-ads
description: 在需要规划、优化或扩展 Google Ads、Meta、LinkedIn、TikTok 等付费投放时使用。
---

# 付费投放（paid-ads）

## 适用场景
- 从零搭建投放结构，或接手已有账户做诊断与优化。
- 需要判断平台选择、预算分配、出价方式和受众策略。
- 已有创意但不知道怎么挂到投放结构里验证。

## 核心约束
- 先明确业务目标、目标 CPA/ROAS、预算边界和转化动作，再谈平台与结构。
- 创意、受众、落地页要拆开排查；不要把所有问题都归到“平台学习期”。
- 平台执行细节优先以 [platform-setup-checklists](references/platform-setup-checklists.md) 和 [audience-targeting](references/audience-targeting.md) 为准。
- 若需要批量创意生成，配合 [ad-creative](../ad-creative/SKILL.md)；若着陆页承接弱，配合 [redesign-my-landingpage](../redesign-my-landingpage/SKILL.md)。

## 代码模式
- 推荐输出模板：

```md
平台：Google Ads
目标：Demo Request
预算：¥800/天

Campaign
- Brand
- Non-brand
- Retargeting

每层输出：
- 目标受众
- 关键词 / 兴趣
- 创意变量
- 着陆页
```

- 常见文案与受众切片可参考 [ad-copy-templates](references/ad-copy-templates.md) 与 [audience-targeting](references/audience-targeting.md)。

## 检查清单
- 是否写清了目标、预算、归因和学习期预期。
- 是否区分获客、再营销、品牌词和实验流量。
- 是否给出了停投、扩量和复盘条件。
- 是否将创意测试与受众测试拆开。

## 反模式
- 在目标不清楚时直接讨论平台技巧。
- 把所有国家、受众、关键词堆进一个 campaign。
- 创意差、页面差、埋点差，却只调出价和预算。
