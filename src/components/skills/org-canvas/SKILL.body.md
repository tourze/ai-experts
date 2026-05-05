## 不适用场景
- 诊断现有组织问题：画布是设计工具不是诊断工具，诊断用 `swot-analysis` 和 `business-health-diagnostic`。
- 需要深入人才管理与团队设计时：[references/talent-management.md](references/talent-management.md)、[references/team-composition-analysis.md](references/team-composition-analysis.md)。

## 代码模式

本 skill 是分析框架，不要求执行代码。输出时按“输入事实 → 框架拆解 → 关键判断 → 下一步动作”的结构组织，可用表格承载维度、证据、判断和建议。

## 反模式

### FAIL: 组织架构图当画布

```
CEO -> VP工程 + VP产品 + VP市场
-> 这是汇报关系不是组织画布
-> 画布关注"为什么这样组织"，不是"谁向谁汇报"
```

### PASS: 战略驱动的组织设计

```
定位：面向中国制造业的 AI 质检平台
策略：AI + 行业 Know-how 双壁垒
-> 组织需要：AI 研发团队 + 行业顾问团队 + 客户成功团队
-> 不需要：大规模销售团队（PLG + 行业口碑获客）
-> 组织结构服务于战略
```
