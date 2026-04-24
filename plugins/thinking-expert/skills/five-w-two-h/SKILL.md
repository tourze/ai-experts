---
name: five-w-two-h
description: 当用户要做全面的问题分析、工作计划制定、需求澄清或确保方案没有遗漏时使用；英文触发词 5W2H、why-what-who-when-where-how、comprehensive analysis、requirement gathering、action plan template。
---

# 5W2H 分析法

## 适用场景
- 快速全面地分析任何问题或制定任何计划。
- 需求澄清：确保方案的七个维度都考虑到了。
- 与 [mckinsey-7-step](../mckinsey-7-step/SKILL.md) 配合：5W2H 做问题澄清，七步法做深度分析。

## 核心约束
- **Why 是起点**——如果 Why 不清楚，其他 6 个都可能是错的。Why 回答的是"为什么值得做"而非"老板说要做"。
- 七个维度必须全部回答，任何一个空白都是潜在风险。
- Who 必须有唯一负责人（不是"团队"），When 必须有具体日期（不是"尽快"），How Much 不只是预算还包括数量/规模/范围。
- 5W2H 是框架不是答案——每个维度要有具体内容，"待定"出现超过 2 个 = 方案还没准备好。
- **维度间有隐含依赖**：Why 决定 What 的边界，What 决定 Who 的技能要求，Who 的能力影响 When 的可行性，How 影响 How Much。发现矛盾时从 Why 重来。
- **How Much 是最常被低估的维度**：只写预算不写范围 = 需求蔓延的温床。必须同时定义"做多少"和"花多少"。

## 不适用场景
- 复杂模糊问题需要拆解：5W2H 假设问题已明确只需要补全维度，模糊问题先用 [mckinsey-7-step](../mckinsey-7-step/SKILL.md) 做结构化拆解。
- 持续改进场景：5W2H 做单次计划，持续改进用 [pdca-cycle](../pdca-cycle/SKILL.md)。

## 代码模式

本 skill 是思维框架，不要求执行代码。输出时先给结构化框架，再列证据、假设和追问，最后给可验证的下一步。

## 检查清单
- [ ] 七个维度全部有实质回答。
- [ ] Why 回答了"为什么值得做"。
- [ ] Who 有唯一负责人而非"大家一起"。
- [ ] When 有具体日期而非"尽快"。

## 反模式

### FAIL: 填空式回答

```
Why: 因为需要  What: 做方案  Who: 团队
When: 尽快  Where: 线上  How: 讨论后确定  How Much: 待定
-> 七个维度全是废话
```

### PASS: 具体可执行

```
Why: 提升新客激活率从 20% 到 35%（影响 Q2 ARR 目标 $2M）
What: 重做 onboarding 流程（从 7 步简化为 3 步 + 自动化引导）
Who: 产品经理 Alice 负责，前端 Bob 执行，设计 Carol 配合
When: 3/15 设计完成 -> 3/25 开发完成 -> 4/1 灰度 -> 4/10 全量
Where: Web 端 + 移动端（Web 先行）
How: 参考竞品 X 的引导流程 + 用户测试验证 + A/B test
How Much: 前端 10 人天 + 设计 3 人天 + A/B 测试工具 $500/月
```
