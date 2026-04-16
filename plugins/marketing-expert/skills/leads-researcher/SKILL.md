---
name: leads-researcher
description: 在已明确目标方向后需要深挖公司信息、联系人或买家信号时使用；若还没定义 ICP，先用 `lead-research-assistant`。
---

# 线索深挖（leads-researcher）

## 适用场景
- 已经有候选公司或行业，需要进一步找联系人和 buyer intent。
- 需要整理公司背景、岗位分布、公开项目、招聘信息或技术栈信号。
- 需要把公开线索整成销售可直接使用的调研卡片。

## 核心约束
- 先确认研究范围：公司、部门、岗位、地区和信号类型。
- 只使用公开信息与合理推断，不伪造私人联系方式或内部状态。
- 联系人发现与公司研究要拆开汇报，避免把猜测写成事实。
- 若任务还是 ICP 阶段，先回到 [lead-research-assistant](../lead-research-assistant/SKILL.md)。

## 代码模式
- 建议先按 [full-guide](references/full-guide.md) 的结构产出调研卡：

```md
公司：Company A
阶段信号：近期招聘 RevOps / 正在扩张北美销售
关键岗位：VP Sales、Head of RevOps
切入点：报表自动化、线索归因、销售效率
风险：预算周期长、已有内部 BI 团队
```

## 检查清单
- 是否区分事实、公开信号和推测结论。
- 是否给出可执行的联系人顺序与切入点。
- 是否说明信号的新鲜度和可信度。
- 是否把研究结果收敛成销售动作，而不是信息堆砌。

## 反模式

### FAIL: 只挖联系人

```
"VP Sales: alice@x.com / bob@x.com / charlie@x.com"
→ 销售："我该联系谁？为什么是 VP Sales？"
→ 答不上
```

### PASS: 角色 + 决策 map

```md
## Company A
- 决策者：CEO（最终签合同）
- 影响者：VP Sales（提需求）
- 用户：Sales Ops Lead（日常使用）
- 守门人：CFO（预算审批）

推荐顺序：
1. 先连 Sales Ops Lead（用户层，最易约见）
2. 通过 ta 引荐 VP Sales（影响者）
3. VP Sales → CEO（决策）
```

### FAIL: 过期信息当现状

```
"VP Sales 是 Alice"
→ Alice 半年前已离职 / 邮件被拒 / 名声受损
```

### PASS: 标记新鲜度

```md
| 信息 | 来源 | 日期 | 置信度 |
| VP Sales: Alice | LinkedIn 公开 | 2024-12 | 高 |
| 团队规模 50 | 公司官网 | 2025-09 | 高 |
| 即将融 B 轮 | The Information 报道 | 2025-08 | 中（未官宣） |
| 已在用 X 工具 | 招聘 JD 提及 | 2025-10 | 中 |
```
