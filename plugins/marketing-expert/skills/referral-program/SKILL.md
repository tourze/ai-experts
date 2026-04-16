---
name: referral-program
description: "在需要设计、优化或复盘推荐计划、联盟计划和口碑增长机制时使用；适合客户转介绍、affiliate、partner program 等场景。"
---

# 推荐与联盟（referral-program）

## 适用场景
- 从零设计 refer-a-friend、affiliate 或 partner program。
- 现有推荐机制参与率低、作弊多或激励不健康。
- 需要判断什么时候该做客户推荐，什么时候该做联盟分佣。

## 核心约束
- 先确认产品分享动机、LTV、CAC 和奖励预算，再设计机制。
- 客户推荐与 affiliate 计划要分开设计：触发时机、关系链和激励逻辑不同。
- 奖励必须与实际价值创造绑定，避免“为了薅奖励而推荐”。
- 若任务是渠道优先级判断，配合 [lead-channel-optimizer](../lead-channel-optimizer/SKILL.md)；若是广告放大，配合 [paid-ads](../paid-ads/SKILL.md)。

## 代码模式
- 推荐输出模板：

```md
计划类型：Customer Referral
触发时机：完成首次成果后 24 小时
奖励：推荐人 1 个月返现，被推荐人 14 天试用
风控：同设备/同付款方式去重
主指标：分享率、被推荐转化率、欺诈率
```

- 参考资料： [program-examples](references/program-examples.md)、[affiliate-programs](references/affiliate-programs.md)。

## 检查清单
- 是否区分推荐人、被推荐人、联盟伙伴三类角色。
- 是否写清奖励发放条件、归因规则和风控边界。
- 是否说明核心触发时机与传播路径。
- 是否给出上线后的监控指标与复盘节奏。

## 反模式
- 奖励设计高于产品价值，吸来一堆低质推荐。
- 不做风控与归因规则，导致作弊或扯皮。
- 把客户推荐和联盟分佣混成一套规则。
