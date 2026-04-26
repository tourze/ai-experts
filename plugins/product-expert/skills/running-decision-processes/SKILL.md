---
name: running-decision-processes
description: 当用户要推进高风险决策、解决分析瘫痪、对齐多方意见或建立 DACI/RAPID 等决策机制时使用；帮助把模糊争论变成可执行流程。
---

# 决策流程

## 适用场景
- 多方分歧、迟迟无法拍板、需要明确决策人和输入边界。
- 需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。
- 做失败预演或事前验尸（pre-mortem）时，可配合 [inversion-strategist](../../../thinking-expert/skills/inversion-strategist/SKILL.md) 与 [planning-under-uncertainty](../planning-under-uncertainty/SKILL.md)。

## 核心约束
- 先定义决策问题、影响范围、不可逆程度和 deadline，再设计流程。
- 明确谁提供输入、谁决策、谁执行，避免“所有人都参与所以没人负责”。
- 决策需要记录理由与前提，方便日后复盘，不是只留一个结论。

## 代码模式
```markdown
问题 -> 备选项 -> 决策标准 -> 角色分工 -> 决策时间点 -> 复盘条件
```

## 检查清单
- [ ] 决策问题、选项和标准已写清。
- [ ] 角色分工、输入边界和最终责任人明确。
- [ ] 已定义做出决定的时间点和所需证据。
- [ ] 结论、理由和后续动作可被追踪。

## 反模式

### FAIL: 无限讨论

```
"我们再多讨论一周"
→ 一周后："要不再听听 X 的意见"
→ 三个月过去 → 机会窗口关闭
```

### PASS: DACI + deadline

```
Decision: 是否进入欧洲市场
Driver: Alex（推动决策）
Approver: CEO（最终拍板）
Contributors: 销售/产品/法务
Informed: 全公司
Deadline: 9月15日
→ 到日子 Approver 必须给 yes/no
```

### FAIL: 只比谁声音大

```
会议上谁讲得久 / 谁职位高 → 决策方向跟着走
→ 真正的关键事实没人说
```

### PASS: 显式标准

```
决策标准：
1. ROI 12 月内为正
2. 不破坏现有客户体验
3. 法律风险 < 中等
→ 候选方案逐项打勾
→ 全过 → 推进；缺项 → 补救或淘汰
```

### FAIL: 不记决策依据

```
3 个月后："为什么我们当初选 A？"
→ 没人记得 → 重新讨论 → 重蹈覆辙
```

### PASS: Decision Log

```
日期 / 问题 / 选项 / 标准 / 决定 / 当时依据 / 复盘条件
→ 6 个月后回看，知道何时该重审
```
