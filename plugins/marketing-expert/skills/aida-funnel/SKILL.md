---
name: aida-funnel
description: 当用户要设计客户认知-兴趣-欲望-行动的转化路径、分析营销漏斗各阶段效率、或优化从曝光到购买的全链路时使用；英文触发词 AIDA、AIDMA、awareness-interest-desire-action、marketing funnel stages、conversion funnel。
---

# AIDA/AIDMA 营销漏斗

## 适用场景
- 设计从"用户不知道你"到"用户买单"的完整路径。
- 诊断营销漏斗在哪个阶段流失最严重。
- 与 [funnel-architect](../../../product-expert/skills/funnel-architect/SKILL.md) 配合：AIDA 定阶段框架，漏斗架构师做深度设计。

## 核心约束
- AIDA = Attention -> Interest -> Desire -> Action。AIDMA 加入 Memory 环节，适合高客单价/长决策周期。
- 每个阶段的营销手段不同，不能用同一种方式打所有阶段。
- 漏斗诊断的关键是找到**流失最大的阶段**，然后集中资源修这一层——不是均匀撒钱。
- 99% 的预算花在 Attention 而后续阶段全漏 = 最常见的浪费。

## 不适用场景
- 已有详细漏斗数据需要深度优化：AIDA 是阶段框架，具体转化优化用 [cro-methodology](../cro-methodology/SKILL.md) 或 [page-cro](../page-cro/SKILL.md)。
- 冲动消费品（决策周期小于 30 秒）：AIDA 假设有认知到考虑的过程，便利店零食不需要 Desire 阶段。

## 检查清单
- [ ] 每个阶段都有对应的营销手段。
- [ ] 有转化率数据或定性判断。
- [ ] 找到了最大流失点。
- [ ] 优化方案针对流失点而非均匀撒钱。

## 反模式

### FAIL: 只做 Attention

```
品牌曝光量 1000 万 -> 注册 500 -> 付费 5
-> 注意力到了但后面全漏
-> 99.95% 的钱花在"让人知道你"而不是"让人买你"
```

### PASS: 找到瓶颈优化

```
Attention: 10万曝光（SEO + 行业媒体）
Interest: 2万访问（20% 转化 OK）
Desire: 500 注册（2.5% 转化 <- 瓶颈）
Action: 200 付费（40% 转化 OK）

诊断：Interest -> Desire 断裂
根因：产品页面只有功能列表，没有客户案例和 ROI 证明
方案：Q1 产出 5 个客户案例 + ROI 计算器 + 免费试用入口
目标：Desire 转化率从 2.5% 提升到 5%
```
