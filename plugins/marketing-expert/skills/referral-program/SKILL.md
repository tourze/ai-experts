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

### FAIL: 奖励高于产品价值

```
"推荐成功送 100 美金现金"
→ 一群羊毛党自推自拉 / 朋友凑数注册
→ 1000 个新用户，付费转化 < 1%
→ 烧了 10w 美金，零有效增长
```

### PASS: 奖励 < LTV 比例

```
- 奖励 = 推荐人 1 月返现 ($30) + 被推荐人 14 天试用
- 触发条件：被推荐人付费第 30 天才结算（防短期欺诈）
- 单用户上限：每月 5 个推荐
- 预算锁：奖励总成本 ≤ 新增 ARR 的 10%
→ 高质量增长 + 单位经济模型为正
```

### FAIL: 客户推荐 = affiliate

```
"客户和 affiliate 共用一套规则"
→ 客户为薅羊毛大量分享 → 品牌掉价
→ Affiliate 觉得佣金低 → 不推
```

### PASS: 拆开

```
| 维度 | Customer Referral | Affiliate |
| 触发 | 完成首次成果后 | 注册时主动加入 |
| 关系 | 朋友推荐 | 商业合作 |
| 奖励 | 服务返现 / 升级 | 佣金 % |
| 风控 | 同设备/付款方式去重 | 30 天 cookie + UTM |
| 文案 | "邀请朋友" | "推广合作" |
```

### FAIL: 无归因规则

```
A 推 B → B 注册 → 90 天后 B 升级
谁的功劳？无规则 → 团队扯皮
```

### PASS: 显式归因

```
推荐 cookie：30 天有效
归因优先级：last referral wins
争议处理：流程文档 + 自动归因日志
```
