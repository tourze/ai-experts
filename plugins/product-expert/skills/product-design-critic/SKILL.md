---
name: product-design-critic
description: 当用户要批判性审视软件产品界面、交互流程、信息层级、信任感或治理暴露时使用。
---

# 产品设计批评

## 适用场景
- 评审页面、工作流、卡片、配置面板、聊天体验或多角色治理界面。
- 需要结合用户路径和竞争上下文时，可配合 [customer-journey-map](../customer-journey-map/SKILL.md)、[obviously-awesome](../competitive-intelligence/SKILL.md) 与 [competitive-teardown](../competitive-intelligence/SKILL.md)。

## 核心约束
- 先讲用户任务、关键决策和风险暴露，再讲样式层建议。
- 输出要说明 trade-off：提升了什么、牺牲了什么、为什么值得。
- 评审对象是产品体验，不是单独某个像素或视觉趋势。

## 代码模式
```markdown
任务目标 -> 主界面承担什么 -> 哪些状态最关键 -> 哪些地方损害信任 -> 建议
```

## 检查清单
- [ ] 已明确目标用户、关键任务与最危险状态。
- [ ] 建议覆盖层级、反馈、空态/错态与信任设计。
- [ ] 每条建议都能落到行为变化，而不是抽象审美。
- [ ] 与产品定位和业务约束不冲突。

## 反模式

### FAIL: 抽象审美词

```
"看起来不够现代""再高级一点"
→ 设计师改了三版仍被否
```

### PASS: 落到行为变化

```
"主 CTA 当前在折叠区下方 → 移到首屏"
"结算第 3 步缺进度指示 → 加 1/3, 2/3"
"错误态只有 'Failed' → 改为 what+why+fix"
```

### FAIL: 只改视觉

```
"重做 Logo + 配色"
→ 用户仍流失，注册流程 12 步没动
```

### PASS: 先架构再视觉

```
1. 流程能 ≤ 3 步完成核心任务吗
2. 主次能一眼看出吗
3. 错态/空态/loading 都做了吗
→ 都通过才碰视觉
```

## 参考资料

- [references/industry-anti-patterns.md](references/industry-anti-patterns.md) — 12+ 行业反模式清单
- `industry-design-presets` — 行业正向预设（风格/配色/字体）
- [customer-journey-map](../customer-journey-map/SKILL.md)
- [obviously-awesome](../competitive-intelligence/SKILL.md)
- [competitive-teardown](../competitive-intelligence/SKILL.md)
