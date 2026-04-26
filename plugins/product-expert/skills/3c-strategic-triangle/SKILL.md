---
name: 3c-strategic-triangle
description: 当用户要从顾客、公司、竞争者三角度做战略分析、找差异化定位或评估竞争可持续性时使用；英文触发词 3C analysis、Ohmae 3C、customer-company-competitor、strategic triangle。
---

# 3C 战略三角

## 适用场景
- 产品定位决策：该服务谁、凭什么赢、对手怎么应对。
- 比 SWOT 更聚焦于竞争关系的快速战略诊断。
- 与 [competitive-teardown](../competitive-teardown/SKILL.md) 配合：3C 做框架，teardown 做深度拆解。

## 核心约束
- 三个 C 必须**相互关联**分析，不能独立罗列。核心问题：我们能为客户做什么竞争对手做不到的事？
- Customer 是起点——不了解客户需求，讨论竞争优势没有意义。
- 最终必须找到三角交汇点：[客户重视] × [我们能做] × [竞品做不到] = 可持续竞争优势。
- 优势必须有可持续性论证（技术壁垒/网络效应/数据飞轮），不是临时的价格优势。

## 不适用场景
- 需要量化决策：3C 是定性框架，需要数字精度时用 [bcg-matrix](../bcg-matrix/SKILL.md)（GE 模式）或 [space-matrix](../space-matrix/SKILL.md)。
- 内部组织诊断：3C 聚焦外部竞争关系，内部问题用 [mckinsey-7s](../mckinsey-7s/SKILL.md)。

## 代码模式

本 skill 是分析框架，不要求执行代码。输出时按“输入事实 → 框架拆解 → 关键判断 → 下一步动作”的结构组织，可用表格承载维度、证据、判断和建议。

## 检查清单
- [ ] 三个 C 都有实质分析，Customer 最详细。
- [ ] 找到了至少一个三角交汇的差异化空间。
- [ ] 竞争优势有可持续性论证。

## 反模式

### FAIL: 三个独立清单

```
Customer: 客户要便宜、要快、要好
Company: 我们技术强、团队好
Competitor: 竞品融资多、品牌响
→ 三个列表互不关联，没有交叉分析
```

### PASS: 三角交叉

```
Customer: 中小企业需要 30 分钟内出财务报告（时间是第一优先级）
Company: 自研 AI 引擎，报告生成 < 5 分钟（技术壁垒 2 年）
Competitor: 最快竞品需要 2 小时，且依赖人工审核
→ 差异化：速度 × 自动化 → 可持续（技术壁垒）
```
